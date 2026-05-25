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

const { data: profiles } = await admin
  .from("profiles")
  .select("id, username, display_name")
  .order("username");

console.log("\n=== Profiles ===");
console.table(profiles ?? []);

const { data: yearbooks } = await admin
  .from("yearbooks")
  .select("id, owner_id, profiles(username, display_name)")
  .order("id");

console.log("\n=== Yearbooks ===");
for (const yb of yearbooks ?? []) {
  console.log({
    id: yb.id,
    owner: yb.profiles?.username ?? yb.owner_id,
  });
}

const { data: entries } = await admin
  .from("entries")
  .select("id, yearbook_id, author_id, page_image_url, created_at, profiles!entries_author_id_fkey(username)")
  .order("created_at", { ascending: false });

console.log("\n=== All entries ===");
console.table(
  (entries ?? []).map((e) => ({
    id: e.id.slice(0, 8),
    yearbook: e.yearbook_id?.slice(0, 8),
    author: e.profiles?.username ?? e.author_id?.slice(0, 8),
    page_image_url: e.page_image_url,
  })),
);

for (const profile of profiles ?? []) {
  if (!profile.username?.startsWith("user")) continue;

  const { data: yb } = await admin
    .from("yearbooks")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!yb) continue;

  const storagePath = `${yb.id}/${profile.id}.jpg`;
  const { data: files } = await admin.storage.from("entry-pdfs").list(yb.id, { limit: 50 });

  console.log(`\n--- ${profile.username} yearbook ${yb.id.slice(0, 8)} ---`);
  console.log("Expected storage:", storagePath);
  console.log(
    "Storage files:",
    (files ?? []).map((f) => `${yb.id}/${f.name}`),
  );
}
