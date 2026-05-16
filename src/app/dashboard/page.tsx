import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PdfExportButton } from "@/components/yearbook/pdf-export-button";
import { ShareControls } from "@/components/yearbook/share-controls";
import { YearbookFlipbook } from "@/components/yearbook/yearbook-flipbook";
import { sampleEntries, sampleInvites, sampleUsers, sampleYearbooks } from "@/lib/dev/sample-yearbook";
import { hasSupabaseEnv, isSampleDataMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookEntry, YearbookInvite } from "@/lib/types/yearbook";

type DashboardPageProps = {
  searchParams: {
    dashboard_error?: string;
  };
};

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

type InviteRow = {
  id: string;
  yearbook_id: string;
  invited_user_id: string;
  invited_at: string;
};

type YearbookRow = {
  id: string;
  owner_id: string;
  share_mode: "link" | "invite_only";
  created_at: string;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (isSampleDataMode) {
    const ownerName = sampleUsers.user1.displayName;
    const yearbook = sampleYearbooks.user1;
    const receivedEntries = sampleEntries.filter((entry) => entry.yearbookId === yearbook.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return (
      <DashboardShell userName={ownerName}>
        <SampleModeBanner />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
                  Your Yearbook
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight">
                  Entries written to {ownerName}
                </h1>
                <p className="mt-3 max-w-2xl text-stone-600">
                  Sample mode is showing User 1&apos;s yearbook without requiring a login session.
                </p>
              </div>
              <PdfExportButton entries={receivedEntries} ownerName={ownerName} />
            </div>
            <YearbookFlipbook entries={receivedEntries} />
          </div>
          <div className="space-y-6">
            <ShareControls
              appUrl={appUrl}
              invites={sampleInvites}
              isSampleMode
              shareMode={yearbook.shareMode}
              yearbookId={yearbook.id}
            />
          </div>
        </section>
      </DashboardShell>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <DashboardShell>
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Setup Needed
          </p>
          <h1 className="mt-2 text-3xl font-bold">Connect Supabase to use the dashboard</h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
            then restart the dev server.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: yearbook, error: yearbookError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("yearbooks")
      .select("id, owner_id, share_mode, created_at")
      .eq("owner_id", user.id)
      .maybeSingle<YearbookRow>(),
  ]);

  if (yearbookError || !yearbook) {
    return (
      <DashboardShell>
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Supabase Setup Needed
          </p>
          <h1 className="mt-2 text-3xl font-bold">No yearbook found for this account</h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            Apply the initial migration and create/sign in with a fresh user so the signup trigger
            can create the profile and yearbook records.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const [{ data: receivedRows }, { data: inviteRows }] = await Promise.all([
    supabase
      .from("entries")
      .select(
        "id, yearbook_id, author_id, author_name, author_university, author_class, content_text, image_urls, created_at, is_visible_to_owner",
      )
      .eq("yearbook_id", yearbook.id)
      .order("created_at", { ascending: false })
      .returns<EntryRow[]>(),
    supabase
      .from("yearbook_invites")
      .select("id, yearbook_id, invited_user_id, invited_at")
      .eq("yearbook_id", yearbook.id)
      .order("invited_at", { ascending: false })
      .returns<InviteRow[]>(),
  ]);

  async function getSignedImageUrls(paths: string[]) {
    if (paths.length === 0) {
      return [];
    }

    const { data } = await supabase.storage.from("entry-images").createSignedUrls(paths, 60 * 60);

    return data?.flatMap((item) => (item.signedUrl ? [item.signedUrl] : [])) ?? [];
  }

  const receivedEntries = await Promise.all(
    (receivedRows ?? []).map(async (row) => mapEntryRow(row, await getSignedImageUrls(row.image_urls ?? []))),
  );
  const invites = (inviteRows ?? []).map(mapInviteRow);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ownerName = profile?.display_name ?? "you";

  return (
    <DashboardShell userName={ownerName}>
      {searchParams.dashboard_error ? (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {searchParams.dashboard_error}
        </p>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
                Your Yearbook
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">
                Entries written to {ownerName}
              </h1>
              <p className="mt-3 max-w-2xl text-stone-600">
                This is your private viewer. Only you can browse the notes people have signed for
                you.
              </p>
            </div>
            <PdfExportButton entries={receivedEntries} ownerName={ownerName} />
          </div>
          <YearbookFlipbook entries={receivedEntries} />
        </div>
        <div className="space-y-6">
          <ShareControls
            appUrl={appUrl}
            invites={invites}
            shareMode={yearbook.share_mode}
            yearbookId={yearbook.id}
          />
        </div>
      </section>
    </DashboardShell>
  );
}

function mapEntryRow(row: EntryRow, signedImageUrls: string[]): YearbookEntry {
  return {
    id: row.id,
    yearbookId: row.yearbook_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorUniversity: row.author_university,
    authorClass: row.author_class,
    contentText: row.content_text ?? "",
    imageUrls: signedImageUrls,
    createdAt: new Date(row.created_at),
    isVisibleToOwner: row.is_visible_to_owner ?? true,
  };
}

function mapInviteRow(row: InviteRow): YearbookInvite {
  return {
    id: row.id,
    yearbookId: row.yearbook_id,
    invitedUserId: row.invited_user_id,
    invitedAt: new Date(row.invited_at),
  };
}

function SampleModeBanner() {
  return (
    <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
      Sample data mode is on. Forms that would change Supabase data are disabled.
    </p>
  );
}
