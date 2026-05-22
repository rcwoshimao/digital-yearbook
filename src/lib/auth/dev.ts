/**
 * Dev-only product features: email/password login, “Preview dashboard” on login,
 * seed/SQL hints in errors and setup screens.
 *
 * Enabled when ANY of:
 * - `NODE_ENV === "development"` — automatic during `npm run dev`
 * - `NEXT_PUBLIC_DEV_FEATURES=true` — set on Cloudflare **preview** / dev-branch deploys
 * - `NEXT_PUBLIC_DEV_EMAIL_AUTH=true` — legacy alias (same behavior)
 *
 * Production (`main` on Cloudflare): leave all unset → hidden in production builds.
 */
function envIsTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const isDevFeaturesEnabled =
  process.env.NODE_ENV === "development" ||
  envIsTrue("NEXT_PUBLIC_DEV_FEATURES") ||
  envIsTrue("NEXT_PUBLIC_DEV_EMAIL_AUTH");

/** Email/password login for seeded accounts (user1 / user2). */
export const hasDevEmailAuth = isDevFeaturesEnabled;
