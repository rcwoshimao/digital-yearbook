"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";
import { isDevFeaturesEnabled } from "@/lib/auth/dev";
import {
  authorEntryPageImagePath,
  deleteAuthorEntriesForYearbook,
  fetchAuthorEntriesForYearbook,
} from "@/lib/yearbook/author-entry";
import { createServiceRoleClient, entryMutationClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";

const MAX_PAGE_IMAGE_SIZE = 10 * 1024 * 1024;

function writeErrorUrl(ownerUsername: string, message: string, debugDetail?: string) {
  const text =
    isDevFeaturesEnabled && debugDetail ? `${message} (${debugDetail})` : message;
  const params = new URLSearchParams({ entry_error: text });
  return `/write/${normalizeUsername(ownerUsername)}?${params.toString()}`;
}

function errorDebugDetail(error: { code?: string; message?: string } | null): string | undefined {
  if (!error?.message) {
    return error?.code;
  }

  return [error.code, error.message].filter(Boolean).join(": ");
}

async function uploadEntryPageImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string,
  bytes: Buffer,
  contentType: string,
) {
  const storage = entryMutationClient(supabase).storage.from("entry-pdfs");
  await storage.remove([objectPath]);

  const { error: uploadError } = await storage.upload(objectPath, bytes, {
    contentType,
    upsert: true,
  });

  return uploadError;
}

async function replaceExistingEntryPage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
  authorId: string,
  pageImageObjectPath: string,
  profile: {
    display_name: string;
    university: string | null;
    graduation_class: string | null;
  },
) {
  return entryMutationClient(supabase)
    .from("entries")
    .update({
      page_image_url: pageImageObjectPath,
      pdf_url: null,
      author_name: profile.display_name,
      author_university: profile.university,
      author_class: profile.graduation_class,
    })
    .eq("id", entryId)
    .eq("author_id", authorId);
}

function isPostgresDuplicate(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "23505") {
    return true;
  }

  return /duplicate key|unique constraint/i.test(error.message ?? "");
}

async function insertCanvasEntryRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: {
    id: string;
    yearbook_id: string;
    author_id: string;
    author_name: string;
    author_university: string | null;
    author_class: string | null;
    page_image_url: string;
  },
) {
  return supabase.from("entries").insert({
    id: row.id,
    yearbook_id: row.yearbook_id,
    author_id: row.author_id,
    author_name: row.author_name,
    author_university: row.author_university,
    author_class: row.author_class,
    content_text: null,
    image_urls: [],
    pdf_url: null,
    page_image_url: row.page_image_url,
  });
}

export async function submitCanvasEntry(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));
  const pageImageFile = formData.get("pageImage");

  if (!yearbookId || !ownerUsername) {
    redirect("/write");
  }

  if (!(pageImageFile instanceof File) || pageImageFile.size === 0) {
    redirect(writeErrorUrl(ownerUsername, "A page image is required to sign this yearbook."));
  }

  if (!pageImageFile.type.startsWith("image/")) {
    redirect(writeErrorUrl(ownerUsername, "Only image uploads are allowed."));
  }

  if (pageImageFile.size > MAX_PAGE_IMAGE_SIZE) {
    redirect(writeErrorUrl(ownerUsername, "The page image must be 10MB or smaller."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, university, graduation_class")
    .eq("id", user.id)
    .maybeSingle<{
      display_name: string;
      university: string | null;
      graduation_class: string | null;
    }>();

  if (profileError || !profile) {
    redirect(writeErrorUrl(ownerUsername, "Complete your profile before writing an entry."));
  }

  const pageImageObjectPath = authorEntryPageImagePath(yearbookId, user.id);
  const pageImageBytes = Buffer.from(await pageImageFile.arrayBuffer());

  let existingRows: Awaited<ReturnType<typeof fetchAuthorEntriesForYearbook>> = [];

  try {
    existingRows = await fetchAuthorEntriesForYearbook(supabase, yearbookId, user.id);
  } catch (fetchError: unknown) {
    redirect(
      writeErrorUrl(
        ownerUsername,
        friendlyErrorMessage(
          fetchError instanceof Error ? fetchError.message : String(fetchError),
          "entry_submit",
        ),
      ),
    );
  }

  // Replace-in-place: upload first, then update the row (never delete storage before this).
  if (existingRows.length === 1) {
    const uploadError = await uploadEntryPageImage(
      supabase,
      pageImageObjectPath,
      pageImageBytes,
      pageImageFile.type,
    );

    if (uploadError) {
      redirect(
        writeErrorUrl(
          ownerUsername,
          friendlyErrorMessage(uploadError, "entry_upload"),
          errorDebugDetail(uploadError),
        ),
      );
    }

    const { error: updateError } = await replaceExistingEntryPage(
      supabase,
      existingRows[0].id,
      user.id,
      pageImageObjectPath,
      profile,
    );

    if (!updateError) {
      revalidatePath("/write");
      revalidatePath(`/write/${ownerUsername}`);
      revalidatePath("/dashboard");
      redirect("/write?signed=1");
    }
  }

  // Full replace or new sign: remove old rows/storage first, then upload once, then insert.
  if (existingRows.length > 0) {
    try {
      await deleteAuthorEntriesForYearbook(supabase, yearbookId, user.id);
    } catch (deleteError: unknown) {
      const detail =
        deleteError instanceof Error ? deleteError.message : String(deleteError);

      redirect(writeErrorUrl(ownerUsername, friendlyErrorMessage(detail, "entry_delete")));
    }

    const stillThere = await fetchAuthorEntriesForYearbook(supabase, yearbookId, user.id);
    if (stillThere.length > 0) {
      redirect(
        writeErrorUrl(
          ownerUsername,
          "Could not replace your previous entry. Delete your signature and try again.",
        ),
      );
    }
  }

  const uploadError = await uploadEntryPageImage(
    supabase,
    pageImageObjectPath,
    pageImageBytes,
    pageImageFile.type,
  );

  if (uploadError) {
    redirect(
      writeErrorUrl(
        ownerUsername,
        friendlyErrorMessage(uploadError, "entry_upload"),
        errorDebugDetail(uploadError),
      ),
    );
  }

  const serviceClient = createServiceRoleClient();
  const entryId = randomUUID();
  const entryRow = {
    id: entryId,
    yearbook_id: yearbookId,
    author_id: user.id,
    author_name: profile.display_name,
    author_university: profile.university,
    author_class: profile.graduation_class,
    page_image_url: pageImageObjectPath,
  };

  let { error: insertError } = await insertCanvasEntryRow(supabase, entryRow);

  if (insertError && isPostgresDuplicate(insertError) && serviceClient) {
    await deleteAuthorEntriesForYearbook(serviceClient, yearbookId, user.id);
    const retry = await insertCanvasEntryRow(supabase, { ...entryRow, id: randomUUID() });
    insertError = retry.error;
  }

  if (insertError) {
    await entryMutationClient(supabase).storage.from("entry-pdfs").remove([pageImageObjectPath]);

    if (isPostgresDuplicate(insertError) && serviceClient) {
      const { data: yearbookEntries } = await serviceClient
        .from("entries")
        .select("author_id")
        .eq("yearbook_id", yearbookId);

      const hasOtherAuthor = (yearbookEntries ?? []).some(
        (row) => row.author_id && row.author_id !== user.id,
      );

      if (hasOtherAuthor) {
        redirect(
          writeErrorUrl(
            ownerUsername,
            "This yearbook already has a signature row tied to another account. Sign in with that account, or delete the row in Supabase → entries.",
          ),
        );
      }
    }

    redirect(
      writeErrorUrl(
        ownerUsername,
        friendlyErrorMessage(insertError, "entry_submit"),
        errorDebugDetail(insertError),
      ),
    );
  }

  revalidatePath("/write");
  revalidatePath(`/write/${ownerUsername}`);
  revalidatePath("/dashboard");
  redirect("/write?signed=1");
}

/** Remove all entries the current user wrote to this yearbook (and related storage files). */
export async function deleteMyYearbookEntry(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));

  if (!yearbookId || !ownerUsername) {
    redirect("/write");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await deleteAuthorEntriesForYearbook(supabase, yearbookId, user.id);
  } catch (error: unknown) {
    redirect(
      writeErrorUrl(
        ownerUsername,
        friendlyErrorMessage(
          error instanceof Error ? error.message : String(error),
          "entry_delete",
        ),
      ),
    );
  }

  revalidatePath("/write");
  revalidatePath(`/write/${ownerUsername}`);
  revalidatePath("/dashboard");

  const params = new URLSearchParams({ entry_removed: "1" });
  redirect(`/write/${ownerUsername}?${params.toString()}`);
}
