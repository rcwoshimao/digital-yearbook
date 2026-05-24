import type { User } from "@supabase/supabase-js";

export function usesGoogleAuth(user: User) {
  return user.identities?.some((identity) => identity.provider === "google") ?? false;
}

export function getPrimaryAuthLabel(user: User) {
  if (usesGoogleAuth(user)) {
    return "Google";
  }

  if (user.identities?.some((identity) => identity.provider === "email")) {
    return "Email";
  }

  return "Account";
}

/** Name from Google (or other OAuth) metadata, when available. */
export function oauthDisplayNameFromUser(user: User): string | null {
  const metadata = user.user_metadata;
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}
