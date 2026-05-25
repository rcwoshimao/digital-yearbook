/**
 * One-shot: remove orphan entry-pdfs objects that have no matching entries row.
 * Usage: node scripts/clear-orphan-entry-storage.mjs
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

const env = loadEnvFile();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: yearbooks } = await admin.from("yearbooks").select("id");
const { data: entries } = await admin.from("entries").select("page_image_url, pdf_url");

const referenced = new Set();
for (const row of entries ?? []) {
  if (row.page_image_url) referenced.add(row.page_image_url);
  if (row.pdf_url) referenced.add(row.pdf_url);
}

let removed = 0;

for (const yb of yearbooks ?? []) {
  const { data: files } = await admin.storage.from("entry-pdfs").list(yb.id, { limit: 500 });
  const orphans = (files ?? [])
    .map((f) => `${yb.id}/${f.name}`)
    .filter((path) => !referenced.has(path));

  if (orphans.length === 0) continue;

  const { error } = await admin.storage.from("entry-pdfs").remove(orphans);
  if (error) {
    console.warn(`Could not remove some files in ${yb.id}:`, error.message);
  } else {
    removed += orphans.length;
    console.log("Removed orphans:", orphans);
  }
}

console.log(`Done. Removed ${removed} orphan object(s).`);
