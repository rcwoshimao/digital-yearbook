import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const sqlPath = resolve(process.cwd(), "supabase/reset_dev_environment.sql");

console.log("");
console.log("Digital Yearbook — dev environment reset");
console.log("=========================================");
console.log("");
console.log("Step 1 — Supabase SQL Editor");
console.log("  Open your project → SQL → New query");
console.log("  Paste the entire file:");
console.log(`  ${sqlPath}`);
console.log("  Click Run. Wait for success (notice at bottom).");
console.log("");
console.log("Step 2 — This script will run npm run seed:dev for auth passwords");
console.log("");

const runSeed = process.argv.includes("--seed");

if (!runSeed) {
  console.log("After SQL succeeds, run:");
  console.log("  npm run reset:dev -- --seed");
  console.log("");
  console.log("Or manually: npm run seed:dev");
  process.exit(0);
}

const seed = spawnSync("npm", ["run", "seed:dev"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

process.exit(seed.status ?? 1);
