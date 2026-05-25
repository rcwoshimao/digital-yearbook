import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { validateServiceRoleKey } from "@/lib/supabase/keys.server";

function normalizeEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

export function getServiceRoleKeyProblem(): string | null {
  const { supabaseUrl } = getSupabaseEnv();
  const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const result = validateServiceRoleKey(serviceRoleKey, supabaseUrl);

  return result.ok ? null : result.reason;
}

/**
 * Server-only Supabase client that bypasses RLS. Use only after verifying the
 * authenticated user id and scoping every query with .eq("author_id", userId).
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleKey || getServiceRoleKeyProblem()) {
    return null;
  }

  const { supabaseUrl } = getSupabaseEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Prefer service role for entry delete/update; fall back to the user session client. */
export function entryMutationClient(userClient: SupabaseClient): SupabaseClient {
  return createServiceRoleClient() ?? userClient;
}
