import { redirect } from "next/navigation";
import { ProfileSetupHintDialog } from "@/components/dashboard/profile-setup-hint-dialog";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ShareControls } from "@/components/yearbook/share-controls";
import { YearbookDashboardSection } from "@/components/yearbook/yearbook-dashboard-section";
import {
  isProfileSchoolIncomplete,
  shouldPromptProfileSetup,
} from "@/lib/profile/setup-hint";
import { defaultCoverStyle } from "@/lib/yearbook/cover-styles";
import { getAppUrl } from "@/lib/app-url";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { ENTRY_SELECT, type EntryRow, mapEntryRow, signEntryRowAssets } from "@/lib/yearbook/entries";
import { loadOwnerYearbook } from "@/lib/yearbook/load-owner-yearbook";
import { loadYearbookInvites } from "@/lib/yearbook/invites";

export default async function DashboardPage() {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, loadedYearbook] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, university, graduation_class, created_at")
      .eq("id", user.id)
      .maybeSingle<{
        display_name: string;
        username: string;
        university: string | null;
        graduation_class: string | null;
        created_at: string;
      }>(),
    loadOwnerYearbook(supabase, user.id),
  ]);

  const yearbook = loadedYearbook.data?.row;
  const yearbookError = loadedYearbook.error;

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

  const appUrl = getAppUrl();
  const ownerName = profile?.display_name ?? "you";
  const coverStyle = loadedYearbook.data?.coverStyle ?? defaultCoverStyle;
  const coverStyleMigrationNeeded = loadedYearbook.data?.coverStyleMigrationNeeded ?? false;
  const profileUsername = profile?.username ?? "";
  const showProfileSetupHint =
    Boolean(profile) &&
    Boolean(profileUsername) &&
    shouldPromptProfileSetup({
      university: profile?.university,
      graduation_class: profile?.graduation_class,
      created_at: profile?.created_at,
    });
  const schoolIncomplete = isProfileSchoolIncomplete(
    profile?.university,
    profile?.graduation_class,
  );

  return (
    <DashboardShell profileUsername={profileUsername} userName={ownerName}>
      {showProfileSetupHint ? (
        <ProfileSetupHintDialog
          profileUsername={profileUsername}
          schoolIncomplete={schoolIncomplete}
          shouldPrompt={showProfileSetupHint}
          userId={user.id}
        />
      ) : null}
      <section className="space-y-6">
        {coverStyleMigrationNeeded ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Cover colors won&apos;t save until you run{" "}
            <code className="rounded bg-amber-100 px-1">
              supabase/migrations/0013_add_yearbook_cover_style.sql
            </code>{" "}
            in the Supabase SQL editor. You can still preview changes on this page.
          </div>
        ) : null}
        <YearbookDashboardSection
          coverStyleMigrationNeeded={coverStyleMigrationNeeded}
          entries={receivedEntries}
          initialCoverStyle={coverStyle}
          ownerClass={profile?.graduation_class}
          ownerName={ownerName}
          ownerUniversity={profile?.university}
          shareUrl={`${appUrl}/write/${profileUsername}`}
          yearbookId={yearbook.id}
        />
        <div className="rounded-[2rem] bg-white/70 p-2 shadow-sm ring-1 ring-stone-200">
          <ShareControls
            appUrl={appUrl}
            invites={invites}
            ownerUsername={profileUsername}
            shareMode={yearbook.share_mode}
            yearbookId={yearbook.id}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
