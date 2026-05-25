import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";

/**
 * Server-side check (use with service role) that the user may sign this yearbook.
 * Returns a user-facing error string, or null when allowed.
 */
export async function yearbookSubmitAccessError(
  client: SupabaseClient,
  yearbookId: string,
  userId: string,
): Promise<string | null> {
  const { data: yearbook, error: yearbookError } = await client
    .from("yearbooks")
    .select("share_mode")
    .eq("id", yearbookId)
    .maybeSingle<{ share_mode: "link" | "invite_only" }>();

  if (yearbookError) {
    return friendlyErrorMessage(yearbookError, "entry_submit");
  }

  if (!yearbook) {
    return "This yearbook was not found.";
  }

  if (yearbook.share_mode === "link") {
    return null;
  }

  const { data: invite, error: inviteError } = await client
    .from("yearbook_invites")
    .select("yearbook_id")
    .eq("yearbook_id", yearbookId)
    .eq("invited_user_id", userId)
    .maybeSingle();

  if (inviteError) {
    return friendlyErrorMessage(inviteError, "entry_submit");
  }

  if (!invite) {
    return "You need an invite to sign this yearbook. Ask the owner to invite your username from their dashboard.";
  }

  return null;
}
