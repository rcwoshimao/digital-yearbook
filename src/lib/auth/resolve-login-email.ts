import { createClient } from "@/lib/supabase/server";
import { isEmailLike } from "@/lib/username";

export async function resolveLoginEmail(identifier: string) {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return null;
  }

  if (isEmailLike(trimmed)) {
    return trimmed.toLowerCase();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_email_for_login", {
    identifier: trimmed,
  });

  if (error) {
    throw error;
  }

  return typeof data === "string" && data.length > 0 ? data : null;
}
