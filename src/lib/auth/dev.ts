/**
 * Dev-only product features: seed/SQL hints in errors and setup screens.
 *
 * Enabled when ANY of:
 * - `NODE_ENV === "development"` — automatic during `npm run dev`
 * - `NEXT_PUBLIC_DEV_FEATURES=true` — set on Cloudflare **preview** / dev-branch deploys
 *
 * Production (`main` on Cloudflare): leave all unset → hidden in production builds.
 */
function envIsTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const isDevFeaturesEnabled =
  process.env.NODE_ENV === "development" || envIsTrue("NEXT_PUBLIC_DEV_FEATURES");
