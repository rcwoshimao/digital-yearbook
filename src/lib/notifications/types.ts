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
] as const;

export type NotificationUrlParam = (typeof NOTIFICATION_URL_PARAMS)[number];

const SIGNED_SUCCESS_MESSAGE = "You've signed the yearbook!";

export function parseNotificationFromSearchParams(
  searchParams: URLSearchParams,
): NotificationPayload | null {
  const authError = searchParams.get("auth_error");
  if (authError) {
    return { message: authError, tone: "error", urlParamsToClear: ["auth_error"] };
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
    return { message: dashboardError, tone: "error", urlParamsToClear: ["dashboard_error"] };
  }

  const profileError = searchParams.get("profile_error");
  if (profileError) {
    return { message: profileError, tone: "error", urlParamsToClear: ["profile_error"] };
  }

  const profileMessage = searchParams.get("profile_message");
  if (profileMessage) {
    return { message: profileMessage, tone: "success", urlParamsToClear: ["profile_message"] };
  }

  const entryError = searchParams.get("entry_error");
  if (entryError) {
    return { message: entryError, tone: "error", urlParamsToClear: ["entry_error"] };
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
