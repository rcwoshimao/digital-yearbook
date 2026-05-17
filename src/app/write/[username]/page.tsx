import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { WriteEntryForm } from "@/components/forms/write-entry-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isUuid, normalizeUsername } from "@/lib/username";

type WriteEntryPageProps = {
  params: {
    username: string;
  };
  searchParams: {
    entry_error?: string;
    entry_message?: string;
  };
};

export default async function WriteEntryPage({ params, searchParams }: WriteEntryPageProps) {
  const slug = normalizeUsername(params.username);


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

  const supabase = createClient();
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

  const [{ data: authorProfile }, { data: yearbook }] = await Promise.all([
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

  if (!authorProfile) {
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

  const { data: existingEntry } = await supabase
    .from("entries")
    .select("created_at")
    .eq("yearbook_id", yearbook.id)
    .eq("author_id", user.id)
    .maybeSingle<{ created_at: string }>();

  const recipientName = ownerProfile.display_name;

  return (
    <WritePageShell ownerUsername={ownerProfile.username} recipientName={recipientName}>
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
          {[ownerProfile.university, ownerProfile.graduation_class].filter(Boolean).join(" · ") ||
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
          authorClass={authorProfile.graduation_class}
          authorName={authorProfile.display_name}
          authorUniversity={authorProfile.university}
          ownerUsername={ownerProfile.username}
          submitError={searchParams.entry_error}
          yearbookId={yearbook.id}
        />
      )}
    </WritePageShell>
  );
}

type WritePageShellProps = {
  children: React.ReactNode;
  ownerUsername: string;
  recipientName?: string;
};

function WritePageShell({ children, ownerUsername, recipientName }: WritePageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
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
        <h1 className="mt-2 text-3xl font-bold">Design your yearbook page</h1>
        <p className="mt-3 text-stone-700">
          {recipientName
            ? `You are signing ${recipientName}'s yearbook on the canvas below.`
            : "You are opening a shared yearbook link."}{" "}
          Your compiled PDF is permanent after you sign.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Yearbook link: <span className="font-semibold text-yearbook-ink">@{ownerUsername}</span>
        </p>
      </div>
      {children}
    </main>
  );
}
