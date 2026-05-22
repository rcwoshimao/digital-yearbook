"use client";

import type { NotificationTone } from "@/lib/notifications/types";

type NotificationBannerProps = {
  message: string;
  onDismiss: () => void;
  tone: NotificationTone;
};

const TONE_STYLES: Record<NotificationTone, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-900",
  info: "border-amber-200 bg-amber-50 text-amber-950",
};

export function NotificationBanner({ message, onDismiss, tone }: NotificationBannerProps) {
  return (
    <div
      className={`fixed inset-x-0 top-0 z-[200] border-b px-4 py-3 shadow-md ${TONE_STYLES[tone]}`}
      role="alert"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          aria-label="Dismiss notification"
          className="shrink-0 rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
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
