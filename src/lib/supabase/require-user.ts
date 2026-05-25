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
  const { data, error } = await supabase.auth.getUser();

  if (error?.message && isAuthSessionErrorMessage(error.message)) {
    loginRedirect(options.writeOwnerUsername);
  }

  const user = data.user;
  if (!user) {
    loginRedirect(options.writeOwnerUsername);
  }

  return user;
}
