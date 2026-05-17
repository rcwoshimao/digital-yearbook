"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";

const MAX_PDF_SIZE = 10 * 1024 * 1024;

function writeUrl(ownerUsername: string, type: "entry_error" | "entry_message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/write/${normalizeUsername(ownerUsername)}?${params.toString()}`;
}

export async function submitPdfEntry(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));
  const pdfFile = formData.get("pdf");

  if (!yearbookId || !ownerUsername) {
    redirect("/write");
  }

  if (!(pdfFile instanceof File) || pdfFile.size === 0) {
    redirect(writeUrl(ownerUsername, "entry_error", "A PDF file is required to sign this yearbook."));
  }

  if (pdfFile.type !== "application/pdf") {
    redirect(writeUrl(ownerUsername, "entry_error", "Only PDF uploads are allowed."));
  }

  if (pdfFile.size > MAX_PDF_SIZE) {
    redirect(writeUrl(ownerUsername, "entry_error", "The compiled PDF must be 10MB or smaller."));
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
    redirect(writeUrl(ownerUsername, "entry_error", "Complete your profile before writing an entry."));
  }

  const entryId = randomUUID();
  const objectPath = `${yearbookId}/${user.id}.pdf`;

  const pdfBytes = Buffer.from(await pdfFile.arrayBuffer());

  // Do not use upsert: true — hosted Supabase often lacks the storage UPDATE policy
  // from migration 0007, and upsert/update then fails with an RLS error.
  let uploadError = (
    await supabase.storage.from("entry-pdfs").upload(objectPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    })
  ).error;

  if (uploadError?.message.toLowerCase().includes("already exists")) {
    await supabase.storage.from("entry-pdfs").remove([objectPath]);
    uploadError = (
      await supabase.storage.from("entry-pdfs").upload(objectPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      })
    ).error;
  }

  if (uploadError) {
    const lower = uploadError.message.toLowerCase();
    const message = lower.includes("bucket not found")
      ? "Storage bucket entry-pdfs is missing. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again."
      : lower.includes("row-level security")
        ? "Could not upload your PDF. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again."
        : uploadError.message;

    redirect(writeUrl(ownerUsername, "entry_error", message));
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
    pdf_url: objectPath,
  });

  if (error) {
    await supabase.storage.from("entry-pdfs").remove([objectPath]);

    const message = error.message.toLowerCase().includes("row-level security")
      ? "Could not save your entry. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again."
      : error.message;

    redirect(writeUrl(ownerUsername, "entry_error", message));
  }

  redirect("/dashboard?signed=1");
}
