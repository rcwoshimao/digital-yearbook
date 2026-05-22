"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";

const MAX_PAGE_IMAGE_SIZE = 10 * 1024 * 1024;

function writeErrorUrl(ownerUsername: string, message: string) {
  const params = new URLSearchParams({ entry_error: message });
  return `/write/${normalizeUsername(ownerUsername)}?${params.toString()}`;
}

async function uploadEntryPageImage(
  supabase: ReturnType<typeof createClient>,
  objectPath: string,
  bytes: Buffer,
  contentType: string,
) {
  let uploadError = (
    await supabase.storage.from("entry-pdfs").upload(objectPath, bytes, {
      contentType,
      upsert: false,
    })
  ).error;

  if (uploadError?.message.toLowerCase().includes("already exists")) {
    await supabase.storage.from("entry-pdfs").remove([objectPath]);
    uploadError = (
      await supabase.storage.from("entry-pdfs").upload(objectPath, bytes, {
        contentType,
        upsert: false,
      })
    ).error;
  }

  return uploadError;
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

  const supabase = createClient();
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

  const entryId = randomUUID();
  const pageImageObjectPath = `${yearbookId}/${user.id}.jpg`;
  const pageImageBytes = Buffer.from(await pageImageFile.arrayBuffer());

  const uploadError = await uploadEntryPageImage(
    supabase,
    pageImageObjectPath,
    pageImageBytes,
    pageImageFile.type,
  );

  if (uploadError) {
    const lower = uploadError.message.toLowerCase();
    const message = lower.includes("bucket not found")
      ? "Storage bucket entry-pdfs is missing. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again."
      : lower.includes("row-level security")
        ? "Could not upload your page. Run supabase/migrations/0008_add_entry_page_image_url.sql in the Supabase SQL editor, then try again."
        : uploadError.message;

    redirect(writeErrorUrl(ownerUsername, message));
  }

  const { error } = await supabase.from("entries").insert({
    id: entryId,
    yearbook_id: yearbookId,
    author_id: user.id,
    author_name: profile.display_name,
    author_university: profile.university,
    author_class: profile.graduation_class,
    content_text: null,
    image_urls: [],
    pdf_url: null,
    page_image_url: pageImageObjectPath,
  });

  if (error) {
    await supabase.storage.from("entry-pdfs").remove([pageImageObjectPath]);

    const message = error.message.toLowerCase().includes("row-level security")
      ? "Could not save your entry. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again."
      : error.message;

    redirect(writeErrorUrl(ownerUsername, message));
  }

  redirect("/write?signed=1");
}