"use server";

import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function encodedMessage(type: "auth_error" | "auth_message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `/?${params.toString()}`;
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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
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

  redirect("/");
}
