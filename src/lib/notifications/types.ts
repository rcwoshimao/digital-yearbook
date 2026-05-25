import {
  friendlyErrorMessage,
  type FriendlyErrorContext,
} from "@/lib/errors/friendly-message";

export type NotificationTone = "error" | "success" | "info";

export type NotificationPayload = {
  message: string;
  tone: NotificationTone;
  /** URL search-param keys to remove when the user dismisses (server redirects). */
  urlParamsToClear?: string[];
};

/** Query params that carry flash messages after server actions. */
export const NOTIFICATION_URL_PARAMS = [
  "auth_error",
  "auth_message",
  "signed",
  "dashboard_error",
  "profile_error",
  "profile_message",
  "entry_error",
  "entry_removed",
] as const;

export type NotificationUrlParam = (typeof NOTIFICATION_URL_PARAMS)[number];

const SIGNED_SUCCESS_MESSAGE = "You've signed the yearbook!";

const LEGACY_ENTRY_ERROR_MESSAGES: Record<string, string> = {
  "You've already signed this yearbook.":
    "You already signed this yearbook. Delete your signature on that page, then sign again.",
  "That record already exists.":
    "Could not save your page. Delete your signature if you have one, then try again.",
  "Could not save your entry because a conflicting record exists. Try Remove my signature, or delete the row in Supabase → entries for this yearbook.":
    "Could not save your page. Delete your signature if you have one, then try again.",
  "JWS Protected Header is invalid":
    "Your session expired or was interrupted. Sign out, sign in again, then try signing.",
};

function sanitizeErrorParam(raw: string, context: FriendlyErrorContext): string {
  const trimmed = raw.trim();
  const legacy =
    LEGACY_ENTRY_ERROR_MESSAGES[trimmed] ??
    Object.entries(LEGACY_ENTRY_ERROR_MESSAGES).find(
      ([key]) => key.toLowerCase() === trimmed.toLowerCase(),
    )?.[1];

  if (legacy) {
    return legacy;
  }

  return friendlyErrorMessage(raw, context);
}

export function parseNotificationFromSearchParams(
  searchParams: URLSearchParams,
): NotificationPayload | null {
  const authError = searchParams.get("auth_error");
  if (authError) {
    return {
      message: sanitizeErrorParam(authError, "auth"),
      tone: "error",
      urlParamsToClear: ["auth_error"],
    };
  }

  const authMessage = searchParams.get("auth_message");
  if (authMessage) {
    return { message: authMessage, tone: "success", urlParamsToClear: ["auth_message"] };
  }

  if (searchParams.has("signed")) {
    return { message: SIGNED_SUCCESS_MESSAGE, tone: "success", urlParamsToClear: ["signed"] };
  }

  const dashboardError = searchParams.get("dashboard_error");
  if (dashboardError) {
    return {
      message: sanitizeErrorParam(dashboardError, "invite"),
      tone: "error",
      urlParamsToClear: ["dashboard_error"],
    };
  }

  const profileError = searchParams.get("profile_error");
  if (profileError) {
    return {
      message: sanitizeErrorParam(profileError, "profile_username"),
      tone: "error",
      urlParamsToClear: ["profile_error"],
    };
  }

  const profileMessage = searchParams.get("profile_message");
  if (profileMessage) {
    return { message: profileMessage, tone: "success", urlParamsToClear: ["profile_message"] };
  }

  const entryError = searchParams.get("entry_error");
  if (entryError) {
    const decoded = decodeURIComponent(entryError);
    const context = /migration 0011|could not remove|delete incomplete/i.test(decoded)
      ? "entry_delete"
      : "entry_submit";

    return {
      message: sanitizeErrorParam(decoded, context),
      tone: "error",
      urlParamsToClear: ["entry_error"],
    };
  }

  if (searchParams.has("entry_removed")) {
    return {
      message: "Signature deleted. You can design and sign a new page.",
      tone: "success",
      urlParamsToClear: ["entry_removed"],
    };
  }

  return null;
}

export function stripNotificationParams(pathname: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);

  for (const key of NOTIFICATION_URL_PARAMS) {
    next.delete(key);
  }

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
