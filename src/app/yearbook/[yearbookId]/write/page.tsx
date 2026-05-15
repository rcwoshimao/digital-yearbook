import { redirect } from "next/navigation";
import { WriteEntryForm } from "@/components/forms/write-entry-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
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
    redirect("/");
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
    supabase.from("yearbooks").select("id").eq("id", params.yearbookId).maybeSingle(),
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

  return (
    <WritePageShell yearbookId={params.yearbookId}>
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
      <WriteEntryForm
        authorClass={profile.graduation_class}
        authorName={profile.display_name}
        authorUniversity={profile.university}
        yearbookId={params.yearbookId}
      />
    </WritePageShell>
  );
}

type WritePageShellProps = {
  children: React.ReactNode;
  yearbookId: string;
};

function WritePageShell({ children, yearbookId }: WritePageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
          Sign a Yearbook
        </p>
        <h1 className="mt-2 text-3xl font-bold">Write a permanent entry</h1>
        <p className="mt-3 text-stone-700">
          You are writing to yearbook <span className="font-mono">{yearbookId}</span>. Entries
          cannot be edited after submission.
        </p>
      </div>
      {children}
    </main>
  );
}
