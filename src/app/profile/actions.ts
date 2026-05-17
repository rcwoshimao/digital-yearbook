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

export async function updateEmail(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!userId) {
    redirect("/login");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    profileRedirect(returnUsername, "profile_error", "Enter a valid email address.");
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

  const currentEmail = user.email?.toLowerCase() ?? "";
  const pendingEmail = user.new_email?.toLowerCase() ?? "";

  if (email === currentEmail || email === pendingEmail) {
    profileRedirect(returnUsername, "profile_message", "That email is already on your account.");
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (!error) {
    await supabase.from("profiles").update({ email }).eq("id", userId);
  }

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("already") && message.includes("registered")) {
      profileRedirect(returnUsername, "profile_error", "That email is already linked to another account.");
    }

    if (message.includes("rate limit")) {
      profileRedirect(
        returnUsername,
        "profile_error",
        "Too many email change attempts. Please wait a few minutes and try again.",
      );
    }

    profileRedirect(returnUsername, "profile_error", error.message);
  }

  revalidateProfile([returnUsername]);
  profileRedirect(
    returnUsername,
    "profile_message",
    "We sent a confirmation link to your new email. Your sign-in email will not change until you confirm it.",
  );
}

export async function resendEmailVerification(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const returnUsername = normalizeUsername(String(formData.get("returnUsername") ?? ""));

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
    profileRedirect(returnUsername, "profile_error", "You can only manage your own account.");
  }

  const targetEmail = user.new_email ?? user.email;

  if (!targetEmail) {
    profileRedirect(returnUsername, "profile_error", "No email address is available to verify.");
  }

  const isPendingChange = Boolean(user.new_email);
  const { error } = await supabase.auth.resend({
    type: isPendingChange ? "email_change" : "signup",
    email: targetEmail,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("rate limit")) {
      profileRedirect(
        returnUsername,
        "profile_error",
        "Too many verification emails sent. Please wait a few minutes before trying again.",
      );
    }

    profileRedirect(returnUsername, "profile_error", error.message);
  }

  revalidateProfile([returnUsername]);
  profileRedirect(
    returnUsername,
    "profile_message",
    isPendingChange
      ? `Sent another confirmation email to ${targetEmail}.`
      : `Sent another verification email to ${targetEmail}.`,
  );
}
