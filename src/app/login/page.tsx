import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { AppBrand } from "@/components/layout/app-brand";
import { hasDevEmailAuth, isDevFeaturesEnabled } from "@/lib/auth/dev";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="yearbook-page-bg absolute inset-0 -z-10" />
      <div className="absolute left-10 top-12 -z-10 h-24 w-24 rounded-full bg-white/40 blur-xl" />
      <div className="absolute bottom-16 right-16 -z-10 h-32 w-32 rounded-full bg-yearbook-accent/20 blur-2xl" />

      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col items-center justify-center gap-10">
        <div className="max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <AppBrand
              className="inline-flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl"
              href="/"
              iconSize={44}
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            A warm place to collect the notes you will keep.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-700">
            Sign in with Google to read your yearbook, invite friends, and write permanent
            graduation memories.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <AuthForm isConfigured={hasSupabaseEnv} showDevEmailAuth={hasDevEmailAuth} />
        </div>

        {isDevFeaturesEnabled ? (
          <Link className="text-sm font-semibold text-yearbook-accent" href="/dashboard">
            Preview dashboard
          </Link>
        ) : null}
      </div>
    </main>
  );
}
