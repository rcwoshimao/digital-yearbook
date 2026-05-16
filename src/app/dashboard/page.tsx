import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PdfExportButton } from "@/components/yearbook/pdf-export-button";
import { ShareControls } from "@/components/yearbook/share-controls";
import { YearbookFlipbook } from "@/components/yearbook/yearbook-flipbook";
import { sampleEntries, sampleInvites, sampleUsers, sampleYearbooks } from "@/lib/dev/sample-yearbook";
import { hasSupabaseEnv, isSampleDataMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookEntry, YearbookInvite } from "@/lib/types/yearbook";
import { normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";

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
  style_config: unknown;
  created_at: string;
  is_visible_to_owner: boolean | null;
};

type InviteRow = {
  id: string;
  yearbook_id: string;
  invited_user_id: string;
  invited_at: string;
};

type InviteProfileRow = {
  id: string;
  username: string;
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
        <section className="space-y-6">
          <YearbookDashboardCard
            description="Sample mode is showing User 1's yearbook without requiring a login session."
            entries={receivedEntries}
            ownerClass={sampleUsers.user1.graduationClass}
            ownerName={ownerName}
            ownerUniversity={sampleUsers.user1.university}
            shareUrl={`${appUrl}/write/${yearbook.id}`}
          />
          <div className="rounded-[2rem] bg-white/70 p-2 shadow-sm ring-1 ring-stone-200">
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
      .select("display_name, university, graduation_class")
      .eq("id", user.id)
      .maybeSingle<{
        display_name: string;
        university: string | null;
        graduation_class: string | null;
      }>(),
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
        "id, yearbook_id, author_id, author_name, author_university, author_class, content_text, image_urls, style_config, created_at, is_visible_to_owner",
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
  const invitedUserIds = Array.from(new Set((inviteRows ?? []).map((invite) => invite.invited_user_id)));
  const { data: invitedProfiles } =
    invitedUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username")
          .in("id", invitedUserIds)
          .returns<InviteProfileRow[]>()
      : { data: [] };
  const invitedUsernamesById = new Map(
    (invitedProfiles ?? []).map((profile) => [profile.id, profile.username]),
  );
  const invites = (inviteRows ?? []).map((row) => mapInviteRow(row, invitedUsernamesById));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ownerName = profile?.display_name ?? "you";

  return (
    <DashboardShell userName={ownerName}>
      {searchParams.dashboard_error ? (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {searchParams.dashboard_error}
        </p>
      ) : null}
      <section className="space-y-6">
        <YearbookDashboardCard
          description="This is your private viewer. Only you can browse the notes people have signed for you."
          entries={receivedEntries}
          ownerClass={profile?.graduation_class}
          ownerName={ownerName}
          ownerUniversity={profile?.university}
          shareUrl={`${appUrl}/write/${yearbook.id}`}
        />
        <div className="rounded-[2rem] bg-white/70 p-2 shadow-sm ring-1 ring-stone-200">
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

type YearbookDashboardCardProps = {
  description: string;
  entries: YearbookEntry[];
  ownerClass?: string | null;
  ownerName: string;
  ownerUniversity?: string | null;
  shareUrl: string;
};

function YearbookDashboardCard({
  description,
  entries,
  ownerClass,
  ownerName,
  ownerUniversity,
  shareUrl,
}: YearbookDashboardCardProps) {
  const entryLabel = entries.length === 1 ? "signed page" : "signed pages";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#6f4728] p-2 shadow-xl shadow-stone-300/60 ring-1 ring-stone-900/10">
      <div className="absolute inset-y-8 left-1/2 hidden w-px bg-stone-900/10 lg:block" />
      <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,#fffef8,#f8ecd8_48%,#ead7bb)] p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-dashed border-yearbook-accent/30" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/40" />
        <div className="pointer-events-none absolute -bottom-20 left-12 h-52 w-52 rounded-full bg-yearbook-accent/10" />

        <div className="relative mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="rounded-[1.75rem] border border-stone-300/70 bg-white/65 p-5 shadow-sm backdrop-blur">
            <p className="font-serif text-sm italic tracking-[0.28em] text-yearbook-accent">
              Digital Yearbook
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-black leading-tight tracking-tight text-yearbook-ink sm:text-5xl">
              {ownerName}&apos;s Memory Book
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">{description}</p>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.75rem] border border-stone-300/70 bg-yearbook-ink p-4 text-white shadow-sm">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                Inside
              </p>
              <p className="mt-2 text-3xl font-black">{entries.length}</p>
              <p className="text-sm text-white/70">{entryLabel}</p>
            </div>
            <PdfExportButton entries={entries} ownerName={ownerName} />
          </div>
        </div>

        <div className="relative rounded-[1.75rem] border border-stone-300/80 bg-white/55 p-4 shadow-inner">
          <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
            <span className="h-px flex-1 bg-stone-300" />
            Flip Through Messages
            <span className="h-px flex-1 bg-stone-300" />
          </div>
          <YearbookFlipbook
            entries={entries}
            ownerClass={ownerClass}
            ownerName={ownerName}
            ownerUniversity={ownerUniversity}
            shareUrl={shareUrl}
          />
        </div>
      </div>
    </div>
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
    styleConfig: normalizeYearbookPageStyle(row.style_config),
    createdAt: new Date(row.created_at),
    isVisibleToOwner: row.is_visible_to_owner ?? true,
  };
}

function mapInviteRow(row: InviteRow, invitedUsernamesById: Map<string, string>): YearbookInvite {
  return {
    id: row.id,
    yearbookId: row.yearbook_id,
    invitedUserId: row.invited_user_id,
    invitedUsername: invitedUsernamesById.get(row.invited_user_id) ?? "unknown",
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
