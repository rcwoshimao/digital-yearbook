import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";
import { normalizeUsername } from "@/lib/username";

export function isAuthSessionErrorMessage(message: string): boolean {
  return /jws|jwt|protected header|bad_jwt|invalid token|refresh token|session/i.test(message);
}

type RequireUserOptions = {
  /** When set, auth failures redirect back to this write page with `entry_error`. */
  writeOwnerUsername?: string;
};

function loginRedirect(writeOwnerUsername?: string): never {
  if (writeOwnerUsername) {
    const params = new URLSearchParams({
      entry_error: friendlyErrorMessage("session expired", "auth"),
    });
    redirect(`/write/${normalizeUsername(writeOwnerUsername)}?${params.toString()}`);
  }

  redirect("/login");
}

/**
 * Validates the Supabase session for server actions. Prefer this over reading `user` alone.
 */
export async function requireUser(
  supabase: SupabaseClient,
  options: RequireUserOptions = {},
): Promise<User> {
  const result = await resolveUser(supabase);

  if (!result.ok) {
    loginRedirect(options.writeOwnerUsername);
  }

  return result.user;
}

/** Returns a friendly error string instead of redirecting (for actions that return JSON errors). */
export async function requireUserMessage(
  supabase: SupabaseClient,
): Promise<{ ok: true; user: User } | { ok: false; message: string }> {
  const result = await resolveUser(supabase);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, user: result.user };
}

async function resolveUser(
  supabase: SupabaseClient,
): Promise<{ ok: true; user: User } | { ok: false; message: string }> {
  const { data, error } = await supabase.auth.getUser();

  if (error?.message && isAuthSessionErrorMessage(error.message)) {
    return {
      ok: false,
      message: friendlyErrorMessage(error.message, "auth"),
    };
  }

  if (!data.user) {
    return {
      ok: false,
      message: friendlyErrorMessage("session expired", "auth"),
    };
  }

  return { ok: true, user: data.user };
}
