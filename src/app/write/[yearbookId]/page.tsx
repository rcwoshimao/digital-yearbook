import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { WriteEntryForm } from "@/components/forms/write-entry-form";
import {
  getSampleRecipient,
  getSampleYearbook,
  sampleEntries,
  sampleUsers,
} from "@/lib/dev/sample-yearbook";
import { hasSupabaseEnv, isSampleDataMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type WriteEntryPageProps = {
  params: {
    yearbookId: string;
  };
  searchParams: {
    entry_error?: string;
    entry_message?: string;
  };
};

export default async function WriteEntryPage({ params, searchParams }: WriteEntryPageProps) {
  if (isSampleDataMode) {
    const yearbook = getSampleYearbook(params.yearbookId);
    const recipient = getSampleRecipient(params.yearbookId);

    if (!yearbook || !recipient) {
      return (
        <WritePageShell yearbookId={params.yearbookId}>
          <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-xl font-bold">Sample yearbook unavailable</h2>
            <p className="mt-2 text-stone-700">
              Sample mode knows User 1 and User 2 only. Open the sample links from the write hub.
            </p>
          </div>
        </WritePageShell>
      );
    }

    const existingEntry = sampleEntries.find(
      (entry) => entry.yearbookId === yearbook.id && entry.authorId === sampleUsers.user1.id,
    );

    return (
      <WritePageShell recipientName={recipient.displayName} yearbookId={params.yearbookId}>
        <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
          Sample data mode is on. You are viewing this as User 1, and entry submission is
          read-only.
        </p>
        <section className="mb-6 rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-700">Writing to</p>
          <h2 className="mt-1 text-2xl font-bold">{recipient.displayName}</h2>
          <p className="text-sm text-stone-600">
            {[recipient.university, recipient.graduationClass].filter(Boolean).join(" · ")}
          </p>
        </section>
        {existingEntry ? (
          <div className="rounded-[2rem] bg-yearbook-paper p-6 text-center shadow-sm ring-1 ring-stone-200">
            <h2 className="text-2xl font-bold">
              You&apos;ve already signed {recipient.displayName}&apos;s yearbook.
            </h2>
            <p className="mt-2 text-stone-700">
              Signed on {format(existingEntry.createdAt, "PPP")}. Each yearbook can only receive
              one note from you.
            </p>
            <Link
              className="mt-5 inline-flex rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
              href="/write"
            >
              Back to Sign Yearbooks
            </Link>
          </div>
        ) : (
          <WriteEntryForm
            authorClass={sampleUsers.user1.graduationClass}
            authorName={sampleUsers.user1.displayName}
            authorUniversity={sampleUsers.user1.university}
            isSampleMode
            yearbookId={params.yearbookId}
          />
        )}
      </WritePageShell>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <WritePageShell yearbookId={params.yearbookId}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Supabase setup needed</h2>
          <p className="mt-2 text-stone-700">
            Add Supabase environment variables in `.env.local` before testing entry submission.
          </p>
        </div>
      </WritePageShell>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: yearbook }] = await Promise.all([
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
      .eq("id", params.yearbookId)
      .maybeSingle<{ id: string; owner_id: string }>(),
  ]);

  if (!yearbook) {
    return (
      <WritePageShell yearbookId={params.yearbookId}>
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Yearbook unavailable</h2>
          <p className="mt-2 text-stone-700">
            This yearbook either does not exist or your account does not have access to write in it.
          </p>
        </div>
      </WritePageShell>
    );
  }

  if (!profile) {
    return (
      <WritePageShell yearbookId={params.yearbookId}>
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

  const [{ data: recipient }, { data: existingEntry }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, university, graduation_class")
      .eq("id", yearbook.owner_id)
      .maybeSingle<{
        display_name: string;
        university: string | null;
        graduation_class: string | null;
      }>(),
    supabase
      .from("entries")
      .select("created_at")
      .eq("yearbook_id", params.yearbookId)
      .eq("author_id", user.id)
      .maybeSingle<{ created_at: string }>(),
  ]);

  const recipientName = recipient?.display_name ?? "this graduate";

  return (
    <WritePageShell recipientName={recipientName} yearbookId={params.yearbookId}>
      {searchParams.entry_error ? (
        <p className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {searchParams.entry_error}
        </p>
      ) : null}
      {searchParams.entry_message ? (
        <p className="mb-6 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          {searchParams.entry_message}
        </p>
      ) : null}
      <section className="mb-6 rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold text-stone-700">Writing to</p>
        <h2 className="mt-1 text-2xl font-bold">{recipientName}</h2>
        <p className="text-sm text-stone-600">
          {[recipient?.university, recipient?.graduation_class].filter(Boolean).join(" · ") ||
            "Profile details unavailable"}
        </p>
      </section>
      {existingEntry ? (
        <div className="rounded-[2rem] bg-yearbook-paper p-6 text-center shadow-sm ring-1 ring-stone-200">
          <h2 className="text-2xl font-bold">You&apos;ve already signed {recipientName}&apos;s yearbook.</h2>
          <p className="mt-2 text-stone-700">
            Signed on {format(new Date(existingEntry.created_at), "PPP")}. Each yearbook can only
            receive one note from you.
          </p>
          <Link
            className="mt-5 inline-flex rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
            href="/write"
          >
            Back to Sign Yearbooks
          </Link>
        </div>
      ) : (
        <WriteEntryForm
          authorClass={profile.graduation_class}
          authorName={profile.display_name}
          authorUniversity={profile.university}
          yearbookId={params.yearbookId}
        />
      )}
    </WritePageShell>
  );
}

type WritePageShellProps = {
  children: React.ReactNode;
  recipientName?: string;
  yearbookId: string;
};

function WritePageShell({ children, recipientName, yearbookId }: WritePageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-semibold text-yearbook-accent" href="/write">
          ← Back to Sign Yearbooks
        </Link>
        <Link className="text-sm font-semibold text-stone-700" href="/dashboard">
          My Yearbook
        </Link>
      </header>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
          Sign a Yearbook
        </p>
        <h1 className="mt-2 text-3xl font-bold">Write a permanent entry</h1>
        <p className="mt-3 text-stone-700">
          {recipientName
            ? `You are writing to ${recipientName}.`
            : "You are opening a shared yearbook link."}{" "}
          Entries cannot be edited after submission.
        </p>
        <p className="mt-2 font-mono text-xs text-stone-500">Yearbook ID: {yearbookId}</p>
      </div>
      {children}
    </main>
  );
}
