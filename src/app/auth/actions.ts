"use server";

import { redirect } from "next/navigation";
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

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(encodedMessage("auth_error", error.message));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseEnv) {
    redirect(encodedMessage("auth_error", "Add Supabase environment variables before signing up."));
  }

  const displayName = String(formData.get("displayName") ?? "");
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username)) {
    redirect(
      encodedMessage(
        "auth_error",
        "Choose a username with 3-30 lowercase letters, numbers, or underscores.",
      ),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
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

  redirect(encodedMessage("auth_message", "Check your email to confirm your account."));
}

export async function signOut() {
  if (hasSupabaseEnv) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
