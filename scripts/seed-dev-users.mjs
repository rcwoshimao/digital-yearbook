import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEV_PASSWORD = "------";

const USERS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "rebeccachencjy@gmail.com",
    displayName: "User 1",
    username: "user1",
    yearbookId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "mantoumiaoshen@gmail.com",
    displayName: "User 2",
    username: "user2",
    yearbookId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  },
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  const contents = readFileSync(envPath, "utf8");
  const values = {};

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

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

async function clearEntryPdfs(admin) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const hasBucket = buckets?.some((bucket) => bucket.id === "entry-pdfs" || bucket.name === "entry-pdfs");
  if (!hasBucket) {
    return;
  }

  const pdfPaths = [];
  for (const user of USERS) {
    const { data: files, error } = await admin.storage.from("entry-pdfs").list(user.yearbookId, {
      limit: 1000,
    });

    if (error) {
      console.warn(`Could not list entry-pdfs/${user.yearbookId}: ${error.message}`);
      continue;
    }

    for (const file of files ?? []) {
      if (file.name) {
        pdfPaths.push(`${user.yearbookId}/${file.name}`);
      }
    }
  }

  for (const user of USERS) {
    for (const other of USERS) {
      pdfPaths.push(`${user.yearbookId}/${other.id}.pdf`);
    }
  }

  const uniquePaths = [...new Set(pdfPaths)];
  if (uniquePaths.length > 0) {
    const { error: removeError } = await admin.storage.from("entry-pdfs").remove(uniquePaths);
    if (removeError) {
      console.warn(`Some PDF objects could not be removed: ${removeError.message}`);
    }
  }
}

async function resetPublicData(admin) {
  const userIds = USERS.map((user) => user.id);
  const yearbookIds = USERS.map((user) => user.yearbookId);

  console.log("Clearing entry-pdfs storage (via API)...");
  await clearEntryPdfs(admin);

  await admin.from("entries").delete().in("yearbook_id", yearbookIds);
  await admin.from("entries").delete().in("author_id", userIds);
  await admin.from("yearbook_invites").delete().in("yearbook_id", yearbookIds);
  await admin.from("yearbooks").delete().in("id", yearbookIds);
  await admin.from("profiles").delete().in("id", userIds);
}

async function upsertUser(admin, user) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed.users.find(
    (candidate) => candidate.id === user.id || candidate.email?.toLowerCase() === user.email,
  );

  if (existing && existing.id !== user.id) {
    await admin.auth.admin.deleteUser(existing.id);
  }

  if (existing?.id === user.id) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: user.email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: user.displayName,
        username: user.username,
      },
    });

    if (error) {
      throw new Error(`Failed to update ${user.username}: ${error.message}`);
    }
  } else {
    const { error } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: user.displayName,
        username: user.username,
      },
    });

    if (error) {
      throw new Error(`Failed to create ${user.username}: ${error.message}`);
    }
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    display_name: user.displayName,
    username: user.username,
    email: user.email,
    university: "Sample University",
    graduation_class: "2026",
  });

  if (profileError) {
    throw new Error(`Failed to upsert profile for ${user.username}: ${profileError.message}`);
  }

  const { error: yearbookError } = await admin.from("yearbooks").upsert({
    id: user.yearbookId,
    owner_id: user.id,
    share_mode: "link",
  });

  if (yearbookError) {
    throw new Error(`Failed to upsert yearbook for ${user.username}: ${yearbookError.message}`);
  }
}

async function verifyLogin(url, anonKey, email) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password: DEV_PASSWORD,
  });

  if (error) {
    throw new Error(`Login verification failed for ${email}: ${error.message}`);
  }

  await client.auth.signOut();
}

async function ensureEntryPdfsBucket(admin) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.id === "entry-pdfs" || bucket.name === "entry-pdfs");

  if (exists) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket("entry-pdfs", {
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(
      `Could not create entry-pdfs bucket: ${createError.message}. Run supabase/reset_dev_environment.sql in the SQL editor.`,
    );
  }

  console.log("Created storage bucket: entry-pdfs");
}

async function main() {
  const env = loadEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Ensuring entry-pdfs storage bucket...");
  await ensureEntryPdfsBucket(admin);

  console.log(
    "Tip: If sign-in or RLS still fails, run supabase/reset_dev_environment.sql in the SQL Editor first.",
  );

  console.log("Resetting dev data...");
  await resetPublicData(admin);

  for (const user of USERS) {
    console.log(`Seeding ${user.username} (${user.email})...`);
    await upsertUser(admin, user);
  }

  console.log("Verifying password login...");
  await verifyLogin(url, anonKey, USERS[0].email);
  await verifyLogin(url, anonKey, USERS[1].email);

  console.log("");
  console.log("Dev accounts ready:");
  for (const user of USERS) {
    console.log(`- ${user.displayName}: ${user.username} / ${user.email} / password ${DEV_PASSWORD}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
