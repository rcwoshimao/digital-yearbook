import Link from "next/link";
import { redirect } from "next/navigation";
import { WrittenEntryLog } from "@/components/yearbook/written-entry-log";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ENTRY_SELECT, type EntryRow, mapEntryRow } from "@/lib/yearbook/entries";

type InviteRow = {
  yearbook_id: string;
};

type YearbookAccessRow = {
  id: string;
  owner_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  username: string;
};

type WritableYearbookTarget = {
  ownerName: string;
  ownerUsername: string;
  yearbookId: string;
};

export default async function WriteHubPage() {

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

  async function getWritableTargets(targetIds: string[], currentUserId: string) {
    if (targetIds.length === 0) {
      return {
        recipientNamesByYearbookId: {},
        writableTargets: [],
      };
    }

    const { data: yearbookRows } = await supabase
      .from("yearbooks")
      .select("id, owner_id")
      .in("id", targetIds)
      .returns<YearbookAccessRow[]>();
    const ownerIds = Array.from(new Set((yearbookRows ?? []).map((yearbook) => yearbook.owner_id)));
    const { data: profileRows } =
      ownerIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", ownerIds)
            .returns<ProfileRow[]>()
        : { data: [] };

    const namesByOwnerId = new Map(
      (profileRows ?? []).map((profile) => [profile.id, profile.display_name]),
    );
    const usernamesByOwnerId = new Map(
      (profileRows ?? []).map((profile) => [profile.id, profile.username]),
    );
    const yearbooksById = new Map((yearbookRows ?? []).map((yearbook) => [yearbook.id, yearbook]));
    const recipientNamesByYearbookId = Object.fromEntries(
      (yearbookRows ?? []).map((yearbook) => [
        yearbook.id,
        namesByOwnerId.get(yearbook.owner_id) ?? "this graduate",
      ]),
    );
    const writableTargets = targetIds.flatMap((yearbookId) => {
      const yearbook = yearbooksById.get(yearbookId);

      if (!yearbook || yearbook.owner_id === currentUserId) {
        return [];
      }

      const ownerUsername = usernamesByOwnerId.get(yearbook.owner_id);

      if (!ownerUsername) {
        return [];
      }

      return [
        {
          ownerName: namesByOwnerId.get(yearbook.owner_id) ?? "this graduate",
          ownerUsername,
          yearbookId,
        },
      ];
    });

    return {
      recipientNamesByYearbookId,
      writableTargets,
    };
  }

  const [{ data: authoredRows }, { data: inviteRows }] = await Promise.all([
    supabase
      .from("entries")
      .select(ENTRY_SELECT)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .returns<EntryRow[]>(),
    supabase
      .from("yearbook_invites")
      .select("yearbook_id")
      .eq("invited_user_id", user.id)
      .returns<InviteRow[]>(),
  ]);

  const authoredEntries = (authoredRows ?? []).map((row) => mapEntryRow(row));
  const targetYearbookIds = Array.from(
    new Set([
      ...(inviteRows ?? []).map((invite) => invite.yearbook_id),
      ...(authoredRows ?? []).map((entry) => entry.yearbook_id),
    ]),
  );
  const { writableTargets, recipientNamesByYearbookId } = await getWritableTargets(
    targetYearbookIds,
    user.id,
  );

  return (
    <WriteHubShell>
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
          Write Entries
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Sign a Yearbook</h1>
        <p className="mt-3 text-stone-700">
          Yearbooks you have been invited to or signed before appear here.
        </p>
        <WritableYearbookList targets={writableTargets} />
      </section>

      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-xl font-bold">Entries I&apos;ve Written</h2>
        <p className="mt-2 text-sm text-stone-600">
          A private reference list of the messages you have sent.
        </p>
        <WrittenEntryLog
          entries={authoredEntries}
          recipientNamesByYearbookId={recipientNamesByYearbookId}
        />
      </section>
    </WriteHubShell>
  );
}

function WriteHubShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-yearbook-paper px-6 py-8">
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

function WritableYearbookList({ targets }: { targets: WritableYearbookTarget[] }) {
  if (targets.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
        No invited or previously opened yearbooks yet.
      </p>
    );
  }

  return (
    <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-yearbook-paper">
      {targets.map((target) => (
        <Link
          className="block p-4 text-sm font-semibold text-yearbook-ink transition hover:bg-white/70"
          href={`/write/${target.ownerUsername}`}
          key={target.yearbookId}
        >
          Sign {target.ownerName}&apos;s yearbook →
        </Link>
      ))}
    </div>
  );
}
