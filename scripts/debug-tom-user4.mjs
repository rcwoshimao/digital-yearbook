import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
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

const TOM_ID = "58eeb330-6e03-4aa9-8902-cad446801a06";
const USER4_YB = "e0196495-3a7d-41fe-85dd-13c75bfe3aca";
const STORAGE_PATH = `${USER4_YB}/${TOM_ID}.jpg`;

const { data: existing } = await admin
  .from("entries")
  .select("*")
  .eq("yearbook_id", USER4_YB)
  .eq("author_id", TOM_ID);

console.log("Tom entries on user4 yearbook:", existing);

const { data: allOnYb } = await admin.from("entries").select("id, author_id").eq("yearbook_id", USER4_YB);
console.log("All entries on user4 yearbook:", allOnYb);

// Test storage remove + upload
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

console.log("\nRemoving storage:", STORAGE_PATH);
const { error: removeErr } = await admin.storage.from("entry-pdfs").remove([STORAGE_PATH]);
console.log("Remove result:", removeErr ?? "ok");

const { error: uploadErr } = await admin.storage.from("entry-pdfs").upload(STORAGE_PATH, tinyPng, {
  contentType: "image/png",
  upsert: false,
});
console.log("Upload (upsert false):", uploadErr ?? "ok");

const { error: insertErr } = await admin.from("entries").insert({
  id: randomUUID(),
  yearbook_id: USER4_YB,
  author_id: TOM_ID,
  author_name: "Tom Park",
  author_university: null,
  author_class: null,
  content_text: null,
  image_urls: [],
  pdf_url: null,
  page_image_url: STORAGE_PATH,
});
console.log("Insert entry:", insertErr ?? "ok");

if (insertErr?.code === "23505") {
  console.log("DUPLICATE detail:", insertErr.message, insertErr.details);
}

// cleanup test insert
if (!insertErr) {
  await admin.from("entries").delete().eq("yearbook_id", USER4_YB).eq("author_id", TOM_ID);
  console.log("Cleaned up test insert");
}
