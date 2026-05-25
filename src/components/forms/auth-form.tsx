"use client";

import { useEffect } from "react";
import { GoogleSignInButton } from "@/components/forms/google-sign-in-button";
import { useNotification } from "@/components/providers/notification-provider";

type AuthFormProps = {
  isConfigured: boolean;
};

export function AuthForm({ isConfigured }: AuthFormProps) {
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
      </div>
    </div>
  );
}
