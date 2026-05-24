const LOCAL_DEV_URL = "http://localhost:3000";

/** Canonical app origin for share links, emails, and server-side redirects. */
export function getAppUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return LOCAL_DEV_URL;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return LOCAL_DEV_URL;
  }

  return configured.replace(/\/$/, "");
}

/** OAuth / email confirmation return URL. Always localhost in dev (not LAN IP). */
export function getAuthCallbackUrl(nextPath = "/dashboard"): string {
  const origin = getAppUrl();
  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";

  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
