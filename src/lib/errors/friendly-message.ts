import { isDevFeaturesEnabled } from "@/lib/auth/dev";
import { messageForInvalidApiKeyError } from "@/lib/supabase/keys";

export type FriendlyErrorContext =
  | "auth"
  | "cover_style"
  | "entry_delete"
  | "entry_submit"
  | "entry_upload"
  | "generic"
  | "invite"
  | "profile_display_name"
  | "profile_school"
  | "profile_username"
  | "revoke_invite"
  | "share_mode";

type ErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

const DUPLICATE_CODES = new Set(["23505"]);

function normalizeErrorText(error: ErrorLike | string | null | undefined): string {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error.trim();
  }

  return [error.message, error.details, error.hint].filter(Boolean).join(" ").trim();
}

function isStorageConflict(text: string): boolean {
  return /storage|object not found|bucket|upload/i.test(text);
}

function isDuplicateViolation(error: ErrorLike | string): string {
  const text = typeof error === "string" ? error : normalizeErrorText(error);
  const code = typeof error === "string" ? undefined : error.code;

  if (code && DUPLICATE_CODES.has(code)) {
    return text;
  }

  if (/duplicate key|unique constraint/i.test(text)) {
    return text;
  }

  // Storage "already exists" is not a Postgres duplicate on entries.
  if (/already exists/i.test(text) && !isStorageConflict(text)) {
    return text;
  }

  return "";
}

function isEntryAuthorDuplicate(text: string): boolean {
  return /one_entry_per_author|entries.*yearbook_id.*author_id|yearbook_id.*author_id/i.test(
    text,
  );
}

function isRlsViolation(text: string): boolean {
  return /row-level security|policy|permission denied|not authorized/i.test(text);
}

function messageForDuplicate(text: string, context: FriendlyErrorContext): string | null {
  if (/yearbook_invites/i.test(text)) {
    return "That person is already invited to your yearbook.";
  }

  if (/profiles.*username|profiles_username/i.test(text)) {
    return "That username is already taken. Try another one.";
  }

  if (/profiles.*email|profiles_email/i.test(text)) {
    return "An account with that email already exists.";
  }

  switch (context) {
    case "invite":
      return "That person is already invited to your yearbook.";
    case "profile_username":
      return "That username is already taken. Try another one.";
    case "entry_upload":
      return "Could not upload your page image. Delete your signature if you have one, then try again.";
    case "entry_submit":
      if (isEntryAuthorDuplicate(text)) {
        return "You already signed this yearbook. Delete your signature, then sign again.";
      }

      return "Could not save your page. Delete your signature if you have one, then try again.";
    case "entry_delete":
      return "Could not remove your entry. Your database may need migration 0011 (authors can delete their own entries).";
    default:
      return "That record already exists.";
  }
}

function messageForRls(context: FriendlyErrorContext): string {
  switch (context) {
    case "invite":
    case "revoke_invite":
    case "share_mode":
      return "You don't have permission to change sharing for this yearbook.";
    case "entry_delete":
      return "You don't have permission to remove this entry.";
    case "entry_submit":
    case "entry_upload":
      return "You don't have permission to submit to this yearbook. Make sure you're signed in and invited.";
    case "profile_display_name":
    case "profile_school":
    case "profile_username":
      return "You don't have permission to update this profile.";
    default:
      return "You don't have permission to do that.";
  }
}

function messageForAuth(text: string): string | null {
  if (text === "Database error querying schema") {
    return isDevFeaturesEnabled
      ? "Your auth user record is missing required fields. Run supabase/dev_seed.sql in the Supabase SQL editor, then try again."
      : "Your account could not be loaded. Try signing out and back in with Google.";
  }

  if (text === "Invalid login credentials") {
    return isDevFeaturesEnabled
      ? "Incorrect email/username or password. If you seeded via SQL, run `npm run seed:dev` to reset test passwords."
      : "Incorrect email or password.";
  }

  if (/email not confirmed/i.test(text)) {
    return "Confirm your email before signing in.";
  }

  if (/user already registered|already been registered/i.test(text)) {
    return "An account with that email already exists. Try signing in instead.";
  }

  if (/password/i.test(text) && /short|least|characters/i.test(text)) {
    return "Choose a stronger password (check Supabase password rules).";
  }

  if (/signup is disabled/i.test(text)) {
    return "New sign-ups are disabled. Contact the site owner.";
  }

  return null;
}

function messageForStorage(text: string): string | null {
  if (/bucket not found/i.test(text)) {
    return "Storage is not set up yet. Run supabase/setup_entry_pdfs_bucket.sql in the Supabase SQL editor, then try again.";
  }

  if (/payload too large|entity too large/i.test(text)) {
    return "That file is too large. Try a smaller image.";
  }

  return null;
}

function fallbackForContext(context: FriendlyErrorContext): string {
  switch (context) {
    case "invite":
      return "Could not send the invite. Please try again.";
    case "revoke_invite":
      return "Could not revoke the invite. Please try again.";
    case "share_mode":
      return "Could not update sharing settings. Please try again.";
    case "cover_style":
      return "Could not save your cover style. Please try again.";
    case "profile_username":
      return "Could not update your username. Please try again.";
    case "profile_display_name":
      return "Could not update your name. Please try again.";
    case "profile_school":
      return "Could not update your school details. Please try again.";
    case "entry_delete":
      return "Could not remove your entry. Please try again.";
    case "entry_submit":
      return "Could not save your entry. Please try again.";
    case "entry_upload":
      return "Could not upload your page. Please try again.";
    case "auth":
      return "Something went wrong. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Maps Supabase/Postgres errors to short, user-facing copy.
 */
export function friendlyErrorMessage(
  error: ErrorLike | string | null | undefined,
  context: FriendlyErrorContext = "generic",
): string {
  const text = normalizeErrorText(error);

  if (!text) {
    return fallbackForContext(context);
  }

  const duplicateText = isDuplicateViolation(typeof error === "string" ? text : (error ?? text));
  if (duplicateText) {
    const duplicateMessage = messageForDuplicate(duplicateText, context);
    if (duplicateMessage) {
      return duplicateMessage;
    }

    if (context === "entry_submit" || context === "entry_delete") {
      return fallbackForContext(context);
    }
  }

  if (isRlsViolation(text)) {
    if (context === "entry_delete") {
      return "Could not remove your entry. Run Supabase migration 0011 so authors can delete their own entries.";
    }

    return messageForRls(context);
  }

  const storageMessage = messageForStorage(text);
  if (storageMessage) {
    return storageMessage;
  }

  if (context === "auth") {
    const authMessage = messageForAuth(text);
    if (authMessage) {
      return authMessage;
    }
  }

  if (/invalid api key/i.test(text)) {
    return messageForInvalidApiKeyError();
  }

  if (/jws|jwt|protected header|bad_jwt|invalid token|refresh token|session/i.test(text)) {
    return "Your session expired or was interrupted. Sign out, sign in again, then try again.";
  }

  if (/network|fetch failed|timeout/i.test(text)) {
    return "Connection problem. Check your internet and try again.";
  }

  if (/foreign key|violates foreign key/i.test(text)) {
    return "That reference is no longer valid. Refresh the page and try again.";
  }

  if (/not found|does not exist/i.test(text) && context === "invite") {
    return "No user found with that username.";
  }

  // Avoid showing raw Postgres/Supabase strings in the UI.
  if (
    /duplicate key|violates|constraint|relation|pg_|SQLSTATE|PostgREST|PGRST/i.test(text) ||
    text.length > 120
  ) {
    return fallbackForContext(context);
  }

  return text;
}
