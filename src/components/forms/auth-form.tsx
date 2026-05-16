"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

type AuthFormProps = {
  authError?: string;
  authMessage?: string;
  isConfigured: boolean;
};

export function AuthForm({ authError, authMessage, isConfigured }: AuthFormProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="rounded-[2rem] bg-white/85 p-6 shadow-xl shadow-yearbook-accent/10 ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 rounded-full bg-yearbook-paper p-1">
        <button
          className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-in" ? "bg-white text-yearbook-ink shadow-sm" : "text-stone-600"
          }`}
          onClick={() => setMode("sign-in")}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-up" ? "bg-white text-yearbook-ink shadow-sm" : "text-stone-600"
          }`}
          onClick={() => setMode("sign-up")}
          type="button"
        >
          Sign Up
        </button>
      </div>

      {!isConfigured ? (
        <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Add Supabase environment variables in `.env.local` to enable sign in and sign up.
        </p>
      ) : null}
      {authError ? (
        <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{authError}</p>
      ) : null}
      {authMessage ? (
        <p className="mb-4 rounded-2xl bg-green-50 p-4 text-sm text-green-700">{authMessage}</p>
      ) : null}

      {mode === "sign-in" ? (
        <form action={signIn} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-sm text-stone-600">Open your yearbook and keep writing.</p>
          </div>
          <AuthField label="Email" name="email" type="email" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConfigured}
          >
            Sign In
          </button>
        </form>
      ) : (
        <form action={signUp} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Create your yearbook</h2>
            <p className="mt-1 text-sm text-stone-600">
              These details appear beside the notes you write.
            </p>
          </div>
          <AuthField label="Display name" name="displayName" type="text" />
          <AuthField label="Username" name="username" placeholder="rebecca2026" type="text" />
          <AuthField label="University" name="university" type="text" />
          <AuthField label="Graduation class" name="graduationClass" placeholder="Class of 2026" type="text" />
          <AuthField label="Email" name="email" type="email" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConfigured}
          >
            Create Account
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
