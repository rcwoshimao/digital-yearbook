"use client";

import type { NotificationTone } from "@/lib/notifications/types";

type NotificationBannerProps = {
  message: string;
  onDismiss: () => void;
  tone: NotificationTone;
};

/** Matches legacy FlashBanner + draft-banner styling (rounded-2xl, soft fills). */
const TONE_STYLES: Record<NotificationTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 font-semibold text-green-800",
  info: "border-amber-200 bg-amber-50 text-amber-950",
};

export function NotificationBanner({ message, onDismiss, tone }: NotificationBannerProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-4 pt-4 sm:pt-5"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-3xl items-start gap-3 rounded-2xl border p-4 text-sm shadow-sm ${TONE_STYLES[tone]}`}
        role="alert"
      >
        <p className="min-w-0 flex-1 leading-snug">{message}</p>
        <button
          aria-label="Dismiss notification"
          className="shrink-0 rounded-full p-1 text-current/60 transition hover:bg-black/5 hover:text-current"
          onClick={onDismiss}
          type="button"
        >
          <span aria-hidden className="block text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
