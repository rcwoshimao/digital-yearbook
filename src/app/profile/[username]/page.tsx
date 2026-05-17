import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { ShareControls } from "@/components/yearbook/share-controls";
import { FlashBanner } from "@/components/ui/flash-banner";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { loadYearbookInvites } from "@/lib/yearbook/invites";
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

  const invites = await loadYearbookInvites(supabase, yearbook.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const email = profile.email ?? user.email ?? "";
  const emailConfirmed = Boolean(user.email_confirmed_at);
  const pendingEmail = user.new_email ?? null;

  return (
    <DashboardShell profileUsername={profile.username} userName={profile.display_name}>
      {searchParams.profile_error ? (
        <FlashBanner message={searchParams.profile_error} tone="error" />
      ) : null}
      {searchParams.profile_message ? (
        <FlashBanner message={searchParams.profile_message} tone="success" />
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
