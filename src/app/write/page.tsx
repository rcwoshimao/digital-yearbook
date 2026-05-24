import Link from "next/link";
import { redirect } from "next/navigation";
import {
  WriteHubYearbookTable,
  type WriteHubYearbookRow,
} from "@/components/yearbook/write-hub-yearbook-table";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ENTRY_SELECT, type EntryRow } from "@/lib/yearbook/entries";

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

export default async function WriteHubPage() {
  if (!hasSupabaseEnv) {
    return (
      <WriteHubShell>
        <SetupCard />
      </WriteHubShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  const signedAtByYearbookId = new Map(
    (authoredRows ?? []).map((row) => [row.yearbook_id, row.created_at]),
  );

  const targetYearbookIds = Array.from(
    new Set([
      ...(inviteRows ?? []).map((invite) => invite.yearbook_id),
      ...(authoredRows ?? []).map((entry) => entry.yearbook_id),
    ]),
  );

  const hubRows = await loadWriteHubRows(supabase, targetYearbookIds, user.id, signedAtByYearbookId);

  return (
    <WriteHubShell>
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
          Sign Yearbooks
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Your yearbooks</h1>
        <p className="mt-3 text-stone-700">
          Every yearbook you can sign appears below. Resume a draft, start a new page, or view one
          you have already signed.
        </p>
        <WriteHubYearbookTable rows={hubRows} />
      </section>
    </WriteHubShell>
  );
}

async function loadWriteHubRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetIds: string[],
  currentUserId: string,
  signedAtByYearbookId: Map<string, string>,
): Promise<WriteHubYearbookRow[]> {
  if (targetIds.length === 0) {
    return [];
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

  return targetIds.flatMap((yearbookId) => {
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
        signedAt: signedAtByYearbookId.get(yearbookId) ?? null,
        yearbookId,
      },
    ];
  });
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
      {children}
    </main>
  );
}

function SetupCard() {
  return (
    <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-3xl font-bold">Sign a Yearbook</h1>
      <p className="mt-3 text-stone-700">
        Add Supabase environment variables before browsing or signing other yearbooks.
      </p>
    </section>
  );
}
