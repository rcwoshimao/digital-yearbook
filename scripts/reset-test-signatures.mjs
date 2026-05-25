/**
 * Wipes all yearbook signatures and entry-pdfs for testing (keeps profiles, yearbooks, invites).
 *
 *   node scripts/reset-test-signatures.mjs --dry-run
 *   node scripts/reset-test-signatures.mjs --confirm
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  const contents = readFileSync(envPath, "utf8");
  const values = {};
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
    values[key] = value;
  }
  return values;
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--confirm");

if (dryRun) {
  console.log("DRY RUN — pass --confirm to wipe signatures.\n");
}

const env = loadEnvFile();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: yearbooks } = await admin.from("yearbooks").select("id");
const yearbookIds = (yearbooks ?? []).map((y) => y.id);

const { data: entries } = await admin.from("entries").select("id, page_image_url, pdf_url");
console.log(`Entries to delete: ${entries?.length ?? 0}`);

const { data: buckets } = await admin.storage.listBuckets();
const hasPdfs = buckets?.some((b) => b.id === "entry-pdfs" || b.name === "entry-pdfs");

let storagePaths = [];
if (hasPdfs) {
  for (const yearbookId of yearbookIds) {
    const { data: files } = await admin.storage.from("entry-pdfs").list(yearbookId, { limit: 1000 });
    for (const file of files ?? []) {
      if (file.name) {
        storagePaths.push(`${yearbookId}/${file.name}`);
      }
    }
  }
}

console.log(`Storage objects to delete: ${storagePaths.length}`);

if (dryRun) {
  console.log("\nSample storage paths:", storagePaths.slice(0, 5));
  process.exit(0);
}

if ((entries?.length ?? 0) > 0) {
  const { error } = await admin.from("entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    throw new Error(`Failed to delete entries: ${error.message}`);
  }
}

if (storagePaths.length > 0) {
  for (let i = 0; i < storagePaths.length; i += 100) {
    const chunk = storagePaths.slice(i, i + 100);
    const { error } = await admin.storage.from("entry-pdfs").remove(chunk);
    if (error) {
      console.warn("Storage remove warning:", error.message);
    }
  }
}

console.log("Done. All signatures and page images cleared. Profiles and yearbooks unchanged.");
