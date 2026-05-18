"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
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
    if (error.code === "23505") {
      profileRedirect(previousUsername, "profile_error", "That username is already taken. Try another one.");
    }

    profileRedirect(previousUsername, "profile_error", error.message);
  }

  revalidateProfile([previousUsername, username]);
  profileRedirect(username, "profile_message", "Username updated.");
}

export async function updateSchool(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));
  const university = String(formData.get("university") ?? "").trim() || null;
  const graduationClass = String(formData.get("graduationClass") ?? "").trim() || null;

  if (!userId) {
    redirect("/login");
  }

  const supabase = createClient();
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
    profileRedirect(returnUsername, "profile_error", error.message);
  }

  revalidateProfile([returnUsername]);
  profileRedirect(returnUsername, "profile_message", "School details updated.");
}

