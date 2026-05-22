"use client";

import { useEffect, useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/forms/google-sign-in-button";
import { useNotification } from "@/components/providers/notification-provider";

type AuthFormProps = {
  isConfigured: boolean;
  showDevEmailAuth: boolean;
};

export function AuthForm({ isConfigured, showDevEmailAuth }: AuthFormProps) {
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const { notifyInfo } = useNotification();

  useEffect(() => {
    if (!isConfigured) {
      notifyInfo("Add Supabase environment variables in `.env.local` to enable sign in.");
    }
  }, [isConfigured, notifyInfo]);

  return (
    <div className="rounded-[2rem] bg-white/85 p-6 shadow-xl shadow-yearbook-accent/10 ring-1 ring-white/70 backdrop-blur">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Continue with Google</h2>
          <p className="mt-1 text-sm text-stone-600">
            Sign in with the Google account you want linked to your yearbook.
          </p>
        </div>

        <GoogleSignInButton disabled={!isConfigured} />

        {showDevEmailAuth ? (
          <>
            <div className="relative py-2 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
              <span className="bg-white/85 px-3">dev only</span>
              <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-stone-200" />
            </div>

            <button
              className="w-full rounded-full border border-dashed border-stone-400 px-5 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
              disabled={!isConfigured}
              onClick={() => setShowEmailAuth((value) => !value)}
              type="button"
            >
              {showEmailAuth ? "Hide email & password" : "Email & password (local dev)"}
            </button>

            {showEmailAuth ? <EmailPasswordAuth isConfigured={isConfigured} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function EmailPasswordAuth({ isConfigured }: { isConfigured: boolean }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-stone-300 bg-yearbook-paper/50 p-4">
      <p className="text-xs text-amber-900">
        Seeded accounts: <span className="font-semibold">user1</span> /{" "}
        <span className="font-semibold">user2</span> with password{" "}
        <span className="font-mono">------</span>.
      </p>

      <div className="rounded-full bg-white p-1">
        <button
          className={`w-1/2 rounded-full px-4 py-2 text-xs font-semibold transition ${
            mode === "sign-in" ? "bg-yearbook-ink text-white shadow-sm" : "text-stone-600"
          }`}
          onClick={() => setMode("sign-in")}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`w-1/2 rounded-full px-4 py-2 text-xs font-semibold transition ${
            mode === "sign-up" ? "bg-yearbook-ink text-white shadow-sm" : "text-stone-600"
          }`}
          onClick={() => setMode("sign-up")}
          type="button"
        >
          Sign Up
        </button>
      </div>

      {mode === "sign-in" ? (
        <form action={signIn} className="space-y-4">
          <AuthField label="Email or username" name="login" placeholder="user1" type="text" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConfigured}
            type="submit"
          >
            Sign in with email
          </button>
        </form>
      ) : (
        <form action={signUp} className="space-y-4">
          <AuthField label="Display name" name="displayName" type="text" />
          <AuthField label="Username" name="username" placeholder="rebecca2026" type="text" />
          <AuthField label="University" name="university" type="text" />
          <AuthField
            label="Graduation class"
            name="graduationClass"
            placeholder="Class of 2026"
            type="text"
          />
          <AuthField label="Email" name="email" type="email" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            Create account with email
          </button>
        </form>
      )}
    </div>
  );
}

type AuthFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type: string;
};

function AuthField({ label, name, placeholder, type }: AuthFieldProps) {
  return (
    <label className="block text-sm font-semibold text-stone-700">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 outline-none transition focus:border-yearbook-accent focus:ring-4 focus:ring-yearbook-accent/10"
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}
