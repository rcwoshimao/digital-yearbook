"use client";

import { useState } from "react";
import { getClientAuthCallbackUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import { useNotification } from "@/components/providers/notification-provider";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  label?: string;
  nextPath?: string;
};

export function GoogleSignInButton({
  disabled = false,
  label = "Continue with Google",
  nextPath = "/dashboard",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { notifyError } = useNotification();

  async function signInWithGoogle() {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = getClientAuthCallbackUrl(nextPath);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        notifyError(friendlyErrorMessage(error, "auth"));
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      notifyError("Could not get Google sign-in URL. Check Supabase Google provider settings.");
      setIsLoading(false);
    } catch (error) {
      notifyError(friendlyErrorMessage(error instanceof Error ? error : String(error), "auth"));
      setIsLoading(false);
    }
  }

  return (
    <button
      className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || isLoading}
      onClick={() => void signInWithGoogle()}
      type="button"
    >
      <GoogleIcon />
      {isLoading ? "Redirecting to Google…" : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
