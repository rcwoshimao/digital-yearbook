import Link from "next/link";
import { redirect } from "next/navigation";
import { WriteHubSearch } from "@/components/forms/write-hub-search";
import { WrittenEntryLog } from "@/components/yearbook/written-entry-log";
import { sampleEntries, sampleUsers, sampleYearbooks } from "@/lib/dev/sample-yearbook";
import { hasSupabaseEnv, isSampleDataMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookEntry } from "@/lib/types/yearbook";

type EntryRow = {
  id: string;
  yearbook_id: string;
  author_id: string | null;
  author_name: string;
  author_university: string | null;
  author_class: string | null;
  content_text: string | null;
  image_urls: string[] | null;
  created_at: string;
  is_visible_to_owner: boolean | null;
};

export default async function WriteHubPage() {
  if (isSampleDataMode) {
    const authoredEntries = sampleEntries.filter((entry) => entry.authorId === sampleUsers.user1.id);

    return (
      <WriteHubShell>
        <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Write Entries
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Sign a Yearbook</h1>
          <p className="mt-3 text-stone-700">
            Sample mode is logged in as User 1. Open User 2&apos;s yearbook to view the sample
            entry User 1 already wrote.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-2xl bg-yearbook-ink px-5 py-4 text-sm font-semibold text-white"
              href={`/write/${sampleYearbooks.user2.id}`}
            >
              Open User 2&apos;s yearbook
            </Link>
            <Link
              className="rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-semibold text-stone-700"
              href={`/write/${sampleYearbooks.user1.id}`}
            >
              Open User 1&apos;s yearbook
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Entries I&apos;ve Written</h2>
          <p className="mt-2 text-sm text-stone-600">
            This sample list shows the single entry User 1 wrote to User 2.
          </p>
          <WrittenEntryLog entries={authoredEntries} />
        </section>
      </WriteHubShell>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <WriteHubShell>
        <SetupCard />
      </WriteHubShell>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: authoredRows } = await supabase
    .from("entries")
    .select(
      "id, yearbook_id, author_id, author_name, author_university, author_class, content_text, image_urls, created_at, is_visible_to_owner",
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .returns<EntryRow[]>();

  const authoredEntries = (authoredRows ?? []).map(mapEntryRow);

  return (
    <WriteHubShell>
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
          Write Entries
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Sign a Yearbook</h1>
        <p className="mt-3 text-stone-700">
          Find someone by profile lookup later, or paste a share link now to open their write form.
        </p>
        <div className="mt-6">
          <WriteHubSearch />
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-xl font-bold">Entries I&apos;ve Written</h2>
        <p className="mt-2 text-sm text-stone-600">
          A private reference list so you can remember whose yearbooks you have signed. The note
          content stays with the recipient.
        </p>
        <WrittenEntryLog entries={authoredEntries} />
      </section>
    </WriteHubShell>
  );
}

function WriteHubShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-semibold text-yearbook-accent" href="/dashboard">
          ← Back to My Yearbook
        </Link>
        <Link className="text-xl font-bold" href="/dashboard">
          Digital Yearbook
        </Link>
      </header>
      <div className="space-y-6">{children}</div>
    </main>
  );
}

function SetupCard() {
  return (
    <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-3xl font-bold">Sign a Yearbook</h1>
      <p className="mt-3 text-stone-700">
        Add Supabase environment variables before browsing or signing other yearbooks.
      </p>
    </div>
  );
}

function mapEntryRow(row: EntryRow): YearbookEntry {
  return {
    id: row.id,
    yearbookId: row.yearbook_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorUniversity: row.author_university,
    authorClass: row.author_class,
    contentText: row.content_text ?? "",
    imageUrls: row.image_urls ?? [],
    createdAt: new Date(row.created_at),
    isVisibleToOwner: row.is_visible_to_owner ?? true,
  };
}
