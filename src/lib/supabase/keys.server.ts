import "server-only";

import {
  decodeSupabaseJwtRole,
  isSupabaseJwtKey,
  supabaseProjectRefFromUrl,
} from "@/lib/supabase/keys";

type SupabaseJwtPayload = {
  role?: string;
  ref?: string;
};

function decodeSupabaseJwtPayload(key: string): SupabaseJwtPayload | null {
  if (!isSupabaseJwtKey(key)) {
    return null;
  }

  try {
    const payloadSegment = key.trim().split(".")[1];
    const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as SupabaseJwtPayload;
  } catch {
    return null;
  }
}

export function validateServiceRoleKey(
  serviceRoleKey: string | undefined,
  supabaseUrl: string,
): { ok: true } | { ok: false; reason: string } {
  const key = serviceRoleKey?.trim();

  if (!key) {
    return {
      ok: false,
      reason:
        "SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it in Cloudflare → Settings → Variables (Production), then redeploy.",
    };
  }

  if (key.startsWith("sb_")) {
    return {
      ok: false,
      reason:
        "SUPABASE_SERVICE_ROLE_KEY looks like a new-format secret key (sb_…). This app needs the legacy JWT service_role key from Supabase → Settings → API → service_role (starts with eyJ).",
    };
  }

  if (!isSupabaseJwtKey(key)) {
    const segmentCount = key.split(".").length;
    const hint =
      key.length < 100
        ? `The server only received ${key.length} characters (the full key is usually 200+). It may be truncated in Cloudflare.`
        : !key.startsWith("eyJ")
          ? "The value does not start with eyJ — you may have pasted the project URL or the wrong key."
          : segmentCount !== 3
            ? `The value has ${segmentCount} dot-separated parts; a JWT must have exactly 3. Remove any extra text or line breaks.`
            : "Remove surrounding quotes and redeploy after saving the secret.";

    return {
      ok: false,
      reason: `SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase JWT. ${hint} Copy the full legacy service_role key from Supabase → Settings → API (starts with eyJ, not sb_).`,
    };
  }

  const role = decodeSupabaseJwtRole(key);

  if (role === "anon") {
    return {
      ok: false,
      reason:
        "SUPABASE_SERVICE_ROLE_KEY is set to the anon key by mistake. Use the service_role key from Supabase → Settings → API instead.",
    };
  }

  if (role !== "service_role") {
    return {
      ok: false,
      reason: `SUPABASE_SERVICE_ROLE_KEY has unexpected role "${role ?? "unknown"}". Use the service_role JWT from Supabase → Settings → API.`,
    };
  }

  const projectRef = supabaseProjectRefFromUrl(supabaseUrl);
  const keyRef = decodeSupabaseJwtPayload(key)?.ref ?? null;

  if (projectRef && keyRef && projectRef !== keyRef) {
    return {
      ok: false,
      reason: `SUPABASE_SERVICE_ROLE_KEY is for project "${keyRef}" but NEXT_PUBLIC_SUPABASE_URL points at "${projectRef}". Both must be from the same Supabase project.`,
    };
  }

  return { ok: true };
}
