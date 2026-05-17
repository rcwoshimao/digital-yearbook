import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { ShareControls } from "@/components/yearbook/share-controls";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { YearbookInvite } from "@/lib/types/yearbook";
import { isUuid, normalizeUsername } from "@/lib/username";

type ProfilePageProps = {
  params: {
    username: string;
  };
  searchParams: {
    profile_error?: string;
    profile_message?: string;
  };
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
  share_mode: "link" | "invite_only";
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const slug = normalizeUsername(params.username);

  if (!hasSupabaseEnv) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (isUuid(slug)) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", slug)
      .maybeSingle<{ username: string }>();

    if (profileById?.username) {
      redirect(`/profile/${profileById.username}`);
    }
  }

  const [{ data: profile }, { data: yearbook }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, email")
      .eq("id", user.id)
      .maybeSingle<{ id: string; display_name: string; username: string; email: string | null }>(),
    supabase
      .from("yearbooks")
      .select("id, share_mode")
      .eq("owner_id", user.id)
      .maybeSingle<YearbookRow>(),
  ]);

  if (!profile) {
    return (
      <DashboardShell userName={user.email?.split("@")[0] ?? "Graduate"}>
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Profile setup needed
          </p>
          <h1 className="mt-2 text-3xl font-bold">Your account is still being set up</h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            We could not find a profile record for this account yet. Run{" "}
            <code className="rounded bg-stone-100 px-1">supabase/dev_seed.sql</code> in the SQL
            editor, or sign up through the app.
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (slug !== profile.username) {
    redirect(`/profile/${profile.username}`);
  }

  if (!yearbook) {
    return (
      <DashboardShell profileUsername={profile.username} userName={profile.display_name}>
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Profile setup needed
          </p>
          <h1 className="mt-2 text-3xl font-bold">Your yearbook is still being set up</h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            Your profile exists, but no yearbook was found. Try signing out and back in so the
            signup trigger can create it.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const { data: inviteRows } = await supabase
    .from("yearbook_invites")
    .select("id, yearbook_id, invited_user_id, invited_at")
    .eq("yearbook_id", yearbook.id)
    .order("invited_at", { ascending: false })
    .returns<InviteRow[]>();

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
    (invitedProfiles ?? []).map((invitedProfile) => [invitedProfile.id, invitedProfile.username]),
  );
  const invites: YearbookInvite[] = (inviteRows ?? []).map((row) => ({
    id: row.id,
    yearbookId: row.yearbook_id,
    invitedUserId: row.invited_user_id,
    invitedUsername: invitedUsernamesById.get(row.invited_user_id) ?? "unknown",
    invitedAt: new Date(row.invited_at),
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const email = profile.email ?? user.email ?? "";
  const emailConfirmed = Boolean(user.email_confirmed_at);
  const pendingEmail = user.new_email ?? null;

  return (
    <DashboardShell profileUsername={profile.username} userName={profile.display_name}>
      {searchParams.profile_error ? (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{searchParams.profile_error}</p>
      ) : null}
      {searchParams.profile_message ? (
        <p className="mb-6 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          {searchParams.profile_message}
        </p>
      ) : null}
      <div className="space-y-8">
        <ProfileSettingsForm
          email={email}
          emailConfirmed={emailConfirmed}
          pendingEmail={pendingEmail}
          returnUsername={profile.username}
          userId={user.id}
          username={profile.username}
        />
        <ShareControls
          appUrl={appUrl}
          invites={invites}
          ownerUsername={profile.username}
          returnPath={`/profile/${profile.username}`}
          shareMode={yearbook.share_mode}
          yearbookId={yearbook.id}
        />
      </div>
    </DashboardShell>
  );
}
