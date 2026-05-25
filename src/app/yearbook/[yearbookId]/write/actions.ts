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
import { isNextNavigationError } from "@/lib/next/is-redirect-error";
import { requireUser, requireUserMessage } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";
import type { SubmitCanvasEntryResult } from "@/app/yearbook/[yearbookId]/write/submit-result";

export type { SubmitCanvasEntryResult } from "@/app/yearbook/[yearbookId]/write/submit-result";

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
  authorId: string,
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
  if (row.author_id !== authorId) {
    throw new Error("Entry author mismatch.");
  }

  return entryMutationClient(supabase).from("entries").insert({
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

async function readPageImageUpload(
  formData: FormData,
): Promise<{ bytes: Buffer; contentType: string } | { message: string }> {
  const value = formData.get("pageImage");

  if (!(value instanceof Blob) || value.size === 0) {
    return { message: "A page image is required to sign this yearbook." };
  }

  const contentType =
    (value instanceof File ? value.type : (value as Blob).type) || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    return { message: "Only image uploads are allowed." };
  }

  if (value.size > MAX_PAGE_IMAGE_SIZE) {
    return { message: "The page image must be 10MB or smaller." };
  }

  return {
    bytes: Buffer.from(await value.arrayBuffer()),
    contentType,
  };
}

/** Returns an error message, or `null` when the entry was saved successfully. */
async function runSubmitCanvasEntry(formData: FormData): Promise<string | null> {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));

  if (!yearbookId || !ownerUsername) {
    return "Missing yearbook information. Go back to Sign Yearbooks and try again.";
  }

  const pageImage = await readPageImageUpload(formData);
  if ("message" in pageImage) {
    return pageImage.message;
  }

  const supabase = await createClient();
  const auth = await requireUserMessage(supabase);

  if (!auth.ok) {
    return auth.message;
  }

  const user = auth.user;
  const db = entryMutationClient(supabase);

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("display_name, university, graduation_class")
    .eq("id", user.id)
    .maybeSingle<{
      display_name: string;
      university: string | null;
      graduation_class: string | null;
    }>();

  if (profileError) {
    return friendlyErrorMessage(profileError, "entry_submit");
  }

  if (!profile) {
    return "Complete your profile before writing an entry.";
  }

  const pageImageObjectPath = authorEntryPageImagePath(yearbookId, user.id);
  const pageImageBytes = pageImage.bytes;
  const pageImageContentType = pageImage.contentType;

  let existingRows: Awaited<ReturnType<typeof fetchAuthorEntriesForYearbook>> = [];

  try {
    existingRows = await fetchAuthorEntriesForYearbook(db, yearbookId, user.id);
  } catch (fetchError: unknown) {
    return friendlyErrorMessage(
      fetchError instanceof Error ? fetchError.message : String(fetchError),
      "entry_submit",
    );
  }

  // Replace-in-place: upload first, then update the row (never delete storage before this).
  if (existingRows.length === 1) {
    const uploadError = await uploadEntryPageImage(
      supabase,
      pageImageObjectPath,
      pageImageBytes,
      pageImageContentType,
    );

    if (uploadError) {
      const message = friendlyErrorMessage(uploadError, "entry_upload");
      return isDevFeaturesEnabled
        ? `${message} (${errorDebugDetail(uploadError) ?? "upload"})`
        : message;
    }

    const { error: updateError } = await replaceExistingEntryPage(
      supabase,
      existingRows[0].id,
      user.id,
      pageImageObjectPath,
      profile,
    );

    if (!updateError) {
      return null;
    }
  }

  // Full replace or new sign: remove old rows/storage first, then upload once, then insert.
  if (existingRows.length > 0) {
    try {
      await deleteAuthorEntriesForYearbook(supabase, yearbookId, user.id);
    } catch (deleteError: unknown) {
      const detail =
        deleteError instanceof Error ? deleteError.message : String(deleteError);

      return friendlyErrorMessage(detail, "entry_delete");
    }

    const stillThere = await fetchAuthorEntriesForYearbook(db, yearbookId, user.id);
    if (stillThere.length > 0) {
      return "Could not replace your previous entry. Delete your signature and try again.";
    }
  }

  const uploadError = await uploadEntryPageImage(
    supabase,
    pageImageObjectPath,
    pageImageBytes,
    pageImageContentType,
  );

  if (uploadError) {
    const message = friendlyErrorMessage(uploadError, "entry_upload");
    return isDevFeaturesEnabled
      ? `${message} (${errorDebugDetail(uploadError) ?? "upload"})`
      : message;
  }

  if (!createServiceRoleClient()) {
    return "Signing is not configured on the server (missing SUPABASE_SERVICE_ROLE_KEY). Add it in Cloudflare and redeploy.";
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

  let { error: insertError } = await insertCanvasEntryRow(supabase, user.id, entryRow);

  if (insertError && isPostgresDuplicate(insertError) && serviceClient) {
    await deleteAuthorEntriesForYearbook(serviceClient, yearbookId, user.id);
    const retry = await insertCanvasEntryRow(supabase, user.id, {
      ...entryRow,
      id: randomUUID(),
    });
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
        return "This yearbook already has a signature row tied to another account. Sign in with that account, or delete the row in Supabase → entries.";
      }
    }

    const message = friendlyErrorMessage(insertError, "entry_submit");
    return isDevFeaturesEnabled
      ? `${message} (${errorDebugDetail(insertError) ?? "insert"})`
      : message;
  }

  return null;
}

export async function submitCanvasEntry(
  formData: FormData,
): Promise<SubmitCanvasEntryResult> {
  try {
    const errorMessage = await runSubmitCanvasEntry(formData);

    if (errorMessage) {
      return { ok: false, message: errorMessage };
    }

    const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));

    revalidatePath("/write");
    revalidatePath(`/write/${ownerUsername}`);
    revalidatePath("/dashboard");
    redirect("/write?signed=1");
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }

    const raw = error instanceof Error ? error.message : String(error);

    return {
      ok: false,
      message: friendlyErrorMessage(raw, "entry_submit"),
    };
  }
}

/** Remove all entries the current user wrote to this yearbook (and related storage files). */
export async function deleteMyYearbookEntry(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));

  if (!yearbookId || !ownerUsername) {
    redirect("/write");
  }

  const supabase = await createClient();
  const user = await requireUser(supabase, { writeOwnerUsername: ownerUsername });

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
