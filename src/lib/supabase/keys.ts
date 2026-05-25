/** Supabase API keys used by this app are legacy JWTs (three segments, starts with eyJ). */

export function isSupabaseJwtKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.startsWith("eyJ") && trimmed.split(".").length === 3;
}

/** Decode JWT payload role without Node Buffer (safe for edge/browser). */
export function decodeSupabaseJwtRole(key: string): string | null {
  if (!isSupabaseJwtKey(key)) {
    return null;
  }

  try {
    const payloadSegment = key.trim().split(".")[1];
    const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json =
      typeof atob === "function"
        ? atob(padded + padding)
        : Buffer.from(padded + padding, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };

    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function supabaseProjectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function messageForInvalidApiKeyError(): string {
  return "Server Supabase API key is invalid. In Cloudflare, set SUPABASE_SERVICE_ROLE_KEY to the service_role JWT from Supabase → Settings → API (not the anon key). Save, redeploy, and try again.";
}
