/**
 * Fails fast when Cloudflare/CI build is missing required NEXT_PUBLIC_* vars.
 * Usage: node scripts/verify-build-env.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  try {
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env optional when Cloudflare injects build variables
  }
}

loadEnvFile();

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const recommended = ["NEXT_PUBLIC_APP_URL"];

const missing = required.filter((name) => !process.env[name]?.trim());
const missingRecommended = recommended.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error("Build aborted — missing required environment variables:");
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error(
    "\nAdd them under Cloudflare → Settings → Build → Build variables and secrets, then redeploy.",
  );
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn("Build warning — recommended variables not set:");
  for (const name of missingRecommended) {
    console.warn(`  - ${name}`);
  }
  console.warn("OAuth redirects may use the wrong host without NEXT_PUBLIC_APP_URL.");
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
if (appUrl && /localhost|127\.0\.0\.1/i.test(appUrl)) {
  console.warn(
    `NEXT_PUBLIC_APP_URL is "${appUrl}" — use your production Workers URL for Cloudflare Production builds.`,
  );
}

console.log("Build environment check passed.");
