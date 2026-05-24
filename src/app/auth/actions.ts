"use server";

import { redirect } from "next/navigation";
import { hasDevEmailAuth } from "@/lib/auth/dev";
import { resolveLoginEmail } from "@/lib/auth/resolve-login-email";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";
import { createClient } from "@/lib/supabase/server";
import {
  graduationClassValidationError,
  parseGraduationClass,
} from "@/lib/profile/graduation-class";
import { isValidUsername, normalizeUsername } from "@/lib/username";

function encodedMessage(type: "auth_error" | "auth_message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/login?${params.toString()}`;
}

export async function signIn(formData: FormData) {
  if (!hasDevEmailAuth) {
    redirect(encodedMessage("auth_error", "Sign in with Google on the login page."));
  }

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(encodedMessage("auth_error", friendlyErrorMessage(error, "auth")));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (!hasDevEmailAuth) {
    redirect(encodedMessage("auth_error", "Sign up with Google on the login page."));
  }

  if (!hasSupabaseEnv) {
    redirect(encodedMessage("auth_error", "Add Supabase environment variables before signing up."));
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const university = String(formData.get("university") ?? "").trim() || null;
  const graduationClassRaw = String(formData.get("graduationClass") ?? "");
  const graduationClassError = graduationClassValidationError(graduationClassRaw);
  if (graduationClassError) {
    redirect(encodedMessage("auth_error", graduationClassError));
  }
  const graduationClass = parseGraduationClass(graduationClassRaw);

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
    },
  });

  if (error) {
    redirect(encodedMessage("auth_error", friendlyErrorMessage(error, "auth")));
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
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
