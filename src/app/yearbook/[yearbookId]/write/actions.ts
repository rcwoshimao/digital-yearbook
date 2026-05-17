"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";
import { normalizeUsername } from "@/lib/username";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function writeUrl(ownerUsername: string, type: "entry_error" | "entry_message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/write/${normalizeUsername(ownerUsername)}?${params.toString()}`;
}

export async function createEntry(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const ownerUsername = normalizeUsername(String(formData.get("ownerUsername") ?? ""));
  const contentText = String(formData.get("contentText") ?? "").trim();
  const styleConfigValue = String(formData.get("styleConfig") ?? "");
  const styleConfig = normalizeYearbookPageStyle(parseStyleConfig(styleConfigValue));
  const imageFiles = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!yearbookId || !ownerUsername) {
    redirect("/write");
  }

  if (!contentText && imageFiles.length === 0) {
    redirect(writeUrl(ownerUsername, "entry_error", "Add a message or at least one image."));
  }

  if (imageFiles.length > MAX_IMAGES) {
    redirect(writeUrl(ownerUsername, "entry_error", "Upload a maximum of 5 images."));
  }

  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) {
      redirect(writeUrl(ownerUsername, "entry_error", "Only image uploads are allowed."));
    }

    if (file.size > MAX_IMAGE_SIZE) {
      redirect(writeUrl(ownerUsername, "entry_error", "Each image must be 5MB or smaller."));
    }
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
  const uploadedPaths: string[] = [];

  for (const file of imageFiles) {
    const extension = file.name.split(".").pop() ?? "jpg";
    const objectPath = `${yearbookId}/${entryId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("entry-images")
      .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("entry-images").remove(uploadedPaths);
      }

      redirect(writeUrl(ownerUsername, "entry_error", uploadError.message));
    }

    uploadedPaths.push(objectPath);
  }

  const { error } = await supabase.from("entries").insert({
    id: entryId,
    yearbook_id: yearbookId,
    author_id: user.id,
    author_name: profile.display_name,
    author_university: profile.university,
    author_class: profile.graduation_class,
    content_text: contentText,
    image_urls: uploadedPaths,
    style_config: styleConfig,
  });

  if (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("entry-images").remove(uploadedPaths);
    }

    redirect(writeUrl(ownerUsername, "entry_error", error.message));
  }

  redirect(writeUrl(ownerUsername, "entry_message", "Entry submitted. It is now locked."));
}

function parseStyleConfig(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
