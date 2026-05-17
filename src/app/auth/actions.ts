"use server";

import { redirect } from "next/navigation";
import { resolveLoginEmail } from "@/lib/auth/resolve-login-email";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isValidUsername, normalizeUsername } from "@/lib/username";

function encodedMessage(type: "auth_error" | "auth_message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/login?${params.toString()}`;
}

export async function signIn(formData: FormData) {
  if (!hasSupabaseEnv) {
    redirect(encodedMessage("auth_error", "Add Supabase environment variables before signing in."));
  }

  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!login || !password) {
    redirect(encodedMessage("auth_error", "Enter your email or username and password."));
  }

  let email: string | null;

  try {
    email = await resolveLoginEmail(login);
  } catch {
    redirect(encodedMessage("auth_error", "Could not look up that account. Try again in a moment."));
  }

  if (!email) {
    redirect(encodedMessage("auth_error", "No account found for that email or username."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === "Database error querying schema"
        ? "Your auth user record is missing required fields. Run supabase/dev_seed.sql in the Supabase SQL editor, then try again."
        : error.message === "Invalid login credentials"
          ? "Incorrect email/username or password. If you seeded via SQL, run `npm run seed:dev` to reset test passwords to ------."
          : error.message;

    redirect(encodedMessage("auth_error", message));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseEnv) {
    redirect(encodedMessage("auth_error", "Add Supabase environment variables before signing up."));
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const university = String(formData.get("university") ?? "").trim() || null;
  const graduationClass = String(formData.get("graduationClass") ?? "").trim() || null;

  if (!displayName) {
    redirect(encodedMessage("auth_error", "Enter a display name."));
  }

  if (!isValidUsername(username)) {
    redirect(
      encodedMessage(
        "auth_error",
        "Choose a username with 3-30 lowercase letters, numbers, or underscores.",
      ),
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
    },
  });

  if (error) {
    redirect(encodedMessage("auth_error", error.message));
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        email,
        university,
        graduation_class: graduationClass,
      })
      .eq("id", data.user.id);
  }

  redirect(encodedMessage("auth_message", "Check your email to confirm your account."));
}

export async function signOut() {
  if (hasSupabaseEnv) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
