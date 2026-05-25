/**
 * Lists entries whose page_image_url points to a missing storage object.
 * Usage: node scripts/list-broken-entry-pages.mjs
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

const { data: entries } = await admin
  .from("entries")
  .select("id, yearbook_id, author_id, page_image_url, profiles!entries_author_id_fkey(username)")
  .not("page_image_url", "is", null);

const broken = [];

for (const entry of entries ?? []) {
  const path = entry.page_image_url;
  const folder = path.split("/")[0];
  const name = path.split("/").slice(1).join("/");
  const { data: files } = await admin.storage.from("entry-pdfs").list(folder, { limit: 500 });
  const exists = (files ?? []).some((f) => f.name === name);

  if (!exists) {
    broken.push({
      entryId: entry.id,
      author: entry.profiles?.username ?? entry.author_id,
      page_image_url: path,
    });
  }
}

if (broken.length === 0) {
  console.log("No broken page images found.");
} else {
  console.log("Broken entries (re-sign with Replace my page):");
  console.table(broken);
}
