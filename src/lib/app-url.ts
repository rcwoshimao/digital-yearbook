const LOCAL_DEV_URL = "http://localhost:3000";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

/** Canonical app origin for share links, emails, and server-side redirects. */
export function getAppUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return LOCAL_DEV_URL;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  return LOCAL_DEV_URL;
}

/**
 * Origin for OAuth in the browser — uses the page you are on (Workers vs localhost),
 * not a value baked in at build time.
 */
export function getBrowserAppOrigin(): string {
  if (typeof window === "undefined") {
    return getAppUrl();
  }

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return normalizeOrigin(window.location.origin);
  }

  if (process.env.NODE_ENV === "development") {
    return LOCAL_DEV_URL;
  }

  return normalizeOrigin(window.location.origin);
}

/** OAuth / email confirmation return URL. */
export function getAuthCallbackUrl(
  nextPath = "/dashboard",
  origin = getAppUrl(),
): string {
  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";

  return `${normalizeOrigin(origin)}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Google OAuth redirect — always matches the site the user signed in from. */
export function getClientAuthCallbackUrl(nextPath = "/dashboard"): string {
  return getAuthCallbackUrl(nextPath, getBrowserAppOrigin());
}
