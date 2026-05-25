import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CanvasEntryEditor } from "@/components/forms/canvas-entry-editor";
import { ClearDraftOnEntryRemoved } from "@/components/yearbook/clear-draft-on-entry-removed";
import { EntryPageContent } from "@/components/yearbook/entry-page-content";
import { RemoveYearbookEntryForm } from "@/components/yearbook/remove-yearbook-entry-form";
import { BOOK_HEIGHT, BOOK_WIDTH } from "@/components/yearbook/flipbook-viewer";
import { ENTRY_SELECT, type EntryRow, mapEntryRow, signEntryRowAssets } from "@/lib/yearbook/entries";
import { isEntryDisplayEmpty } from "@/lib/yearbook/author-entry";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isUuid, normalizeUsername } from "@/lib/username";

type WriteEntryPageProps = {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    replace?: string;
  }>;
};

export default async function WriteEntryPage({ params, searchParams }: WriteEntryPageProps) {
  const { username } = await params;
  const { replace } = await searchParams;
  const slug = normalizeUsername(username);
  const replaceExistingEntry = replace === "1";

  if (!hasSupabaseEnv) {
    return (
      <WritePageShell ownerUsername={slug}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Supabase setup needed</h2>
          <p className="mt-2 text-stone-700">
            Add Supabase environment variables in `.env.local` before testing entry submission.
          </p>
        </div>
      </WritePageShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (isUuid(slug)) {
    const { data: yearbookById } = await supabase
      .from("yearbooks")
      .select("owner_id")
      .eq("id", slug)
      .maybeSingle<{ owner_id: string }>();

    if (yearbookById) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", yearbookById.owner_id)
        .maybeSingle<{ username: string }>();

      if (ownerProfile?.username) {
        redirect(`/write/${ownerProfile.username}`);
      }
    }
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id, display_name, university, graduation_class, username")
    .eq("username", slug)
    .maybeSingle<{
      id: string;
      display_name: string;
      university: string | null;
      graduation_class: string | null;
      username: string;
    }>();

  if (!ownerProfile) {
    return (
      <WritePageShell ownerUsername={slug}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Yearbook unavailable</h2>
          <p className="mt-2 text-stone-700">
            No graduate was found with username @{slug}. Check the link and try again.
          </p>
        </div>
      </WritePageShell>
    );
  }

  const [{ data: authorProfile }, { data: signerProfile }, { data: yearbook }] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", user.id).maybeSingle<{ id: string }>(),
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
      .select("id, owner_id")
      .eq("owner_id", ownerProfile.id)
      .maybeSingle<{ id: string; owner_id: string }>(),
  ]);

  if (!yearbook) {
    return (
      <WritePageShell ownerUsername={ownerProfile.username}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Yearbook unavailable</h2>
          <p className="mt-2 text-stone-700">
            @{ownerProfile.username} does not have a yearbook yet, or your account cannot access it.
          </p>
        </div>
      </WritePageShell>
    );
  }

  if (!authorProfile || !signerProfile) {
    return (
      <WritePageShell ownerUsername={ownerProfile.username}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Profile needed</h2>
          <p className="mt-2 text-stone-700">
            Your profile record was not found. Reapply the migration and sign in again with a fresh
            account so the signup trigger can create it.
          </p>
        </div>
      </WritePageShell>
    );
  }

  const { data: existingEntryRows } = await supabase
    .from("entries")
    .select(ENTRY_SELECT)
    .eq("yearbook_id", yearbook.id)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .returns<EntryRow[]>();

  const existingEntryRow = existingEntryRows?.[0] ?? null;
  const duplicateEntryCount = existingEntryRows?.length ?? 0;

  const recipientName = ownerProfile.display_name;
  const recipientMeta =
    [ownerProfile.university, ownerProfile.graduation_class].filter(Boolean).join(" · ") ||
    "Profile details unavailable";

  if (existingEntryRow && !replaceExistingEntry) {
    const signedEntry = mapEntryRow(
      existingEntryRow,
      await signEntryRowAssets(supabase, existingEntryRow),
    );
    const pageMissing = isEntryDisplayEmpty(signedEntry);

    return (
      <WritePageShell mode="view-signed" ownerUsername={ownerProfile.username}>
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              You&apos;ve already signed {recipientName}&apos;s yearbook.
            </h2>
            <p className="mt-2 text-stone-700">
              Signed on {format(signedEntry.createdAt, "PPP")}. Each yearbook can only receive one
              note from you.
            </p>
            {pageMissing ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
                Your saved page is missing or broken. Remove the old signature and sign again, or
                replace it with a new design.
              </p>
            ) : null}
            {duplicateEntryCount > 1 ? (
              <p className="mt-3 text-sm text-red-800">
                Multiple signature records were found ({duplicateEntryCount}). Remove your
                signature to clear them, then sign once.
              </p>
            ) : null}
          </div>

          <div
            className="mx-auto flex h-full min-h-[12rem] items-center justify-center overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-stone-200"
            style={{
              aspectRatio: `${BOOK_WIDTH} / ${BOOK_HEIGHT}`,
              maxWidth: BOOK_WIDTH,
              width: "100%",
            }}
          >
            {pageMissing ? (
              <p className="px-8 text-center text-sm text-stone-500">No page image to display</p>
            ) : (
              <EntryPageContent entry={signedEntry} showSignedPageMetadata={false} />
            )}
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <Link
              className="inline-flex rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
              href={`/write/${ownerProfile.username}?replace=1`}
            >
              Replace my page
            </Link>
            <RemoveYearbookEntryForm
              ownerUsername={ownerProfile.username}
              yearbookId={yearbook.id}
            />
            <Link
              className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
              href="/write"
            >
              Back to Sign Yearbooks
            </Link>
          </div>
        </div>
      </WritePageShell>
    );
  }

  return (
    <WritePageShell
      mode="editor"
      ownerUsername={ownerProfile.username}
      recipientMeta={recipientMeta}
      recipientName={recipientName}
      yearbookId={yearbook.id}
    >
      <ClearDraftOnEntryRemoved yearbookId={yearbook.id} />
      {replaceExistingEntry ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You are replacing your previous signature. Preview your page, then sign to save the new
          version.
        </p>
      ) : null}
      <CanvasEntryEditor
        authorClass={signerProfile.graduation_class}
        authorName={signerProfile.display_name}
        authorUniversity={signerProfile.university}
        ownerUsername={ownerProfile.username}
        yearbookId={yearbook.id}
      />
    </WritePageShell>
  );
}

type WritePageShellProps = {
  children: React.ReactNode;
  mode?: "editor" | "view-signed";
  ownerUsername: string;
  recipientMeta?: string;
  recipientName?: string;
  yearbookId?: string;
};

function WritePageShell({
  children,
  mode = "editor",
  ownerUsername,
  recipientMeta,
  recipientName,
  yearbookId,
}: WritePageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-yearbook-paper px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-semibold text-yearbook-accent" href="/write">
          ← Back to Sign Yearbooks
        </Link>
        <Link className="text-sm font-semibold text-stone-700" href="/dashboard">
          My Yearbook
        </Link>
      </header>
      {mode === "editor" ? (
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
            Sign a Yearbook
          </p>
          <h1 className="mt-2 text-3xl font-bold">Design your yearbook page</h1>
          {recipientName ? (
            <>
              <h2 className="mt-4 text-2xl font-bold">{recipientName}</h2>
              {recipientMeta ? <p className="text-sm text-stone-600">{recipientMeta}</p> : null}
              <p className="mt-3 text-stone-700">
                Design your page on the canvas below. Your signed page is permanent after you submit.
              </p>
              <p className="mt-3 text-xs font-semibold text-amber-800">
                Once signed, this entry cannot be edited. You can preview and return to edit before
                signing.
              </p>
            </>
          ) : (
            <p className="mt-3 text-stone-700">You are opening a shared yearbook link.</p>
          )}
          <p className="mt-2 text-sm text-stone-500">
            Yearbook link: <span className="font-semibold text-yearbook-ink">@{ownerUsername}</span>
          </p>
          {yearbookId ? (
            <div className="mt-3">
              <RemoveYearbookEntryForm
                ownerUsername={ownerUsername}
                variant="compact"
                yearbookId={yearbookId}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </main>
  );
}
