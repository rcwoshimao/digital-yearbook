import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LandingPageProps = {
  searchParams: {
    auth_error?: string;
    auth_message?: string;
  };
};

export default function LandingPage({ searchParams }: LandingPageProps) {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_420px]">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-yearbook-accent">
          Digital Graduation Yearbook
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Collect graduation memories that stay locked in place.
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-700">
          A private yearbook space where classmates can sign in, write permanent
          entries, and share memories with text and images.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
          >
            View Dashboard
          </Link>
          <Link
            href="/yearbook/demo/write"
            className="rounded-full border border-yearbook-accent px-5 py-3 text-sm font-semibold text-yearbook-accent"
          >
            Preview Write Flow
          </Link>
        </div>
      </div>
      <AuthForm
        authError={searchParams.auth_error}
        authMessage={searchParams.auth_message}
        isConfigured={hasSupabaseEnv}
      />
    </main>
  );
}
