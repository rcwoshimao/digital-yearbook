"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";
import { createClient } from "@/lib/supabase/server";
import {
  displayNameValidationMessage,
  isValidDisplayName,
  normalizeDisplayName,
} from "@/lib/profile/display-name";
import {
  graduationClassValidationError,
  parseGraduationClass,
} from "@/lib/profile/graduation-class";
import { isValidUsername, normalizeUsername } from "@/lib/username";

function profileRedirect(username: string, type: "profile_error" | "profile_message", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/profile/${normalizeUsername(username)}?${params.toString()}`);
}

function revalidateProfile(usernames: string[]) {
  for (const username of usernames) {
    revalidatePath(`/profile/${username}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/write");
}

export async function updateDisplayName(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));
  const displayName = normalizeDisplayName(String(formData.get("displayName") ?? ""));

  if (!userId) {
    redirect("/login");
  }

  if (!isValidDisplayName(displayName)) {
    profileRedirect(returnUsername, "profile_error", displayNameValidationMessage());
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id !== userId) {
    profileRedirect(returnUsername, "profile_error", "You can only edit your own profile.");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle<{ display_name: string }>();

  if (existingProfile?.display_name === displayName) {
    profileRedirect(returnUsername, "profile_message", "Name is already up to date.");
  }

  const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);

  if (error) {
    profileRedirect(
      returnUsername,
      "profile_error",
      friendlyErrorMessage(error, "profile_display_name"),
    );
  }

  revalidateProfile([returnUsername]);
  profileRedirect(returnUsername, "profile_message", "Name updated.");
}

export async function updateUsername(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));
  const username = normalizeUsername(String(formData.get("username") ?? ""));

  if (!userId) {
    redirect("/login");
  }

  if (!isValidUsername(username)) {
    profileRedirect(
      returnUsername,
      "profile_error",
      "Usernames must be 3–30 characters and use only lowercase letters, numbers, or underscores.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id !== userId) {
    profileRedirect(returnUsername, "profile_error", "You can only edit your own profile.");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle<{ username: string }>();

  const previousUsername = existingProfile?.username ?? returnUsername;

  if (previousUsername === username) {
    profileRedirect(username, "profile_message", "Username is already up to date.");
  }

  const { error } = await supabase.from("profiles").update({ username }).eq("id", userId);

  if (error) {
    profileRedirect(
      previousUsername,
      "profile_error",
      friendlyErrorMessage(error, "profile_username"),
    );
  }

  revalidateProfile([previousUsername, username]);
  profileRedirect(username, "profile_message", "Username updated.");
}

export async function updateSchool(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));
  const university = String(formData.get("university") ?? "").trim() || null;
  const graduationClassRaw = String(formData.get("graduationClass") ?? "");
  const graduationClassError = graduationClassValidationError(graduationClassRaw);
  if (graduationClassError) {
    profileRedirect(returnUsername, "profile_error", graduationClassError);
  }
  const graduationClass = parseGraduationClass(graduationClassRaw);

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id !== userId) {
    profileRedirect(returnUsername, "profile_error", "You can only edit your own profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      university,
      graduation_class: graduationClass,
    })
    .eq("id", userId);

  if (error) {
    profileRedirect(returnUsername, "profile_error", friendlyErrorMessage(error, "profile_school"));
  }

  revalidateProfile([returnUsername]);
  profileRedirect(returnUsername, "profile_message", "School details updated.");
}

