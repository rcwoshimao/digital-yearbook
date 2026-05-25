"use client";

import { useEffect, useRef, useTransition } from "react";
import { updateCoverStyle } from "@/app/dashboard/actions";
import { useNotification } from "@/components/providers/notification-provider";
import {
  coverColorPresets,
  type YearbookCoverStyle,
} from "@/lib/yearbook/cover-styles";

type CoverStyleControlsProps = {
  coverStyle: YearbookCoverStyle;
  migrationNeeded?: boolean;
  onCoverStyleChange: (style: YearbookCoverStyle) => void;
  yearbookId: string;
};

export function CoverStyleControls({
  coverStyle,
  migrationNeeded = false,
  onCoverStyleChange,
  yearbookId,
}: CoverStyleControlsProps) {
  const { notifyError } = useNotification();
  const [isPending, startTransition] = useTransition();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStyleRef = useRef(coverStyle);

  useEffect(() => {
    latestStyleRef.current = coverStyle;
  }, [coverStyle]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function scheduleSave(nextStyle: YearbookCoverStyle) {
    if (migrationNeeded) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateCoverStyle(yearbookId, latestStyleRef.current);
        if (!result.ok) {
          notifyError(result.message);
        }
      });
    }, 450);
  }

  function applyStyle(nextStyle: YearbookCoverStyle) {
    latestStyleRef.current = nextStyle;
    onCoverStyleChange(nextStyle);
    scheduleSave(nextStyle);
  }

  return (
    <section
      aria-label="Cover appearance"
      className="rounded-2xl border border-stone-200 bg-white/85 p-4 shadow-sm"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Cover</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100">
          <span>Color</span>
          <input
            aria-label="Cover color"
            className="h-8 w-10 cursor-pointer rounded border border-stone-300"
            disabled={isPending}
            onChange={(event) =>
              applyStyle({ ...coverStyle, background_color: event.target.value })
            }
            type="color"
            value={coverStyle.background_color}
          />
        </label>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cover color presets">
          {coverColorPresets.map((preset) => (
            <button
              aria-label={`${preset.label} cover`}
              aria-pressed={coverStyle.background_color === preset.value}
              className={`h-7 w-7 rounded-full border-2 transition hover:scale-105 ${
                coverStyle.background_color === preset.value
                  ? "border-yearbook-accent ring-2 ring-yearbook-accent/30"
                  : "border-stone-300"
              }`}
              disabled={isPending}
              key={preset.value}
              onClick={() => applyStyle({ ...coverStyle, background_color: preset.value })}
              style={{ backgroundColor: preset.value }}
              title={preset.label}
              type="button"
            />
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
          <input
            checked={coverStyle.pattern === "damask"}
            className="accent-yearbook-accent"
            disabled={isPending}
            onChange={(event) =>
              applyStyle({
                ...coverStyle,
                pattern: event.target.checked ? "damask" : "none",
              })
            }
            type="checkbox"
          />
          Victorian damask
        </label>

        {isPending ? <span className="text-xs text-stone-500">Saving…</span> : null}
      </div>
    </section>
  );
}
