import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PdfExportButton } from "@/components/yearbook/pdf-export-button";
import { ShareControls } from "@/components/yearbook/share-controls";
import { YearbookFlipbook } from "@/components/yearbook/yearbook-flipbook";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { ENTRY_SELECT, type EntryRow, mapEntryRow, signEntryRowAssets } from "@/lib/yearbook/entries";
import { loadYearbookInvites } from "@/lib/yearbook/invites";

type DashboardPageProps = {
  searchParams: {
    dashboard_error?: string;
    signed?: string;
  };
};

type YearbookRow = {
  id: string;
  owner_id: string;
  share_mode: "link" | "invite_only";
  created_at: string;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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
      .select("display_name, username, university, graduation_class")
      .eq("id", user.id)
      .maybeSingle<{
        display_name: string;
        username: string;
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
      <DashboardShell profileUsername={profile?.username} userName={profile?.display_name}>
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

  const [{ data: receivedRows }, invites] = await Promise.all([
    supabase
      .from("entries")
      .select(ENTRY_SELECT)
      .eq("yearbook_id", yearbook.id)
      .order("created_at", { ascending: false })
      .returns<EntryRow[]>(),
    loadYearbookInvites(supabase, yearbook.id),
  ]);

  const receivedEntries: YearbookEntry[] = await Promise.all(
    (receivedRows ?? []).map(async (row) => mapEntryRow(row, await signEntryRowAssets(supabase, row))),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ownerName = profile?.display_name ?? "you";
  const entryLabel = receivedEntries.length === 1 ? "signed page" : "signed pages";

  return (
    <DashboardShell profileUsername={profile?.username} userName={ownerName}>
      {searchParams.signed ? (
        <FlashBanner message="You've signed the yearbook!" tone="success-emphasis" />
      ) : null}
      {searchParams.dashboard_error ? (
        <FlashBanner message={searchParams.dashboard_error} tone="error" />
      ) : null}
      <section className="space-y-6">
        <YearbookFlipbook
          entries={receivedEntries}
          ownerClass={profile?.graduation_class}
          ownerName={ownerName}
          ownerUniversity={profile?.university}
          shareUrl={`${appUrl}/write/${profile?.username ?? ""}`}
          toolbarEnd={
            <PdfExportButton
              entries={receivedEntries}
              ownerClass={profile?.graduation_class}
              ownerName={ownerName}
              ownerUniversity={profile?.university}
            />
          }
          toolbarStart={
            <p className="whitespace-nowrap text-sm font-bold text-yearbook-ink">
              {receivedEntries.length} {entryLabel}
            </p>
          }
        />
        <div className="rounded-[2rem] bg-white/70 p-2 shadow-sm ring-1 ring-stone-200">
          <ShareControls
            appUrl={appUrl}
            invites={invites}
            ownerUsername={profile?.username ?? ""}
            shareMode={yearbook.share_mode}
            yearbookId={yearbook.id}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
