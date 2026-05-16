import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: {
    auth_error?: string;
    auth_message?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#fbd38d,transparent_32%),radial-gradient(circle_at_bottom_right,#f7b2ad,transparent_28%),linear-gradient(135deg,#fff8ed,#f9ead7)]" />
      <div className="absolute left-10 top-12 -z-10 h-24 w-24 rounded-full bg-white/40 blur-xl" />
      <div className="absolute bottom-16 right-16 -z-10 h-32 w-32 rounded-full bg-yearbook-accent/20 blur-2xl" />

      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col items-center justify-center gap-10">
        <div className="max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-yearbook-accent">
            Digital Graduation Yearbook
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            A warm place to collect the notes you will keep.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-700">
            Sign in to read your yearbook, invite friends, and write permanent graduation memories.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <AuthForm
            authError={searchParams.auth_error}
            authMessage={searchParams.auth_message}
            isConfigured={hasSupabaseEnv}
          />
        </div>

        <Link className="text-sm font-semibold text-yearbook-accent" href="/dashboard">
          Preview dashboard
        </Link>
      </div>
    </main>
  );
}
