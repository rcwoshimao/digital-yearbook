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
