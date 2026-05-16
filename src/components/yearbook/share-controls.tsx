 "use client";

import { useState } from "react";
import { addInvite, revokeInvite, updateShareMode } from "@/app/dashboard/actions";
import type { YearbookInvite } from "@/lib/types/yearbook";

type ShareControlsProps = {
  appUrl: string;
  invites: YearbookInvite[];
  isSampleMode?: boolean;
  shareMode: "link" | "invite_only";
  yearbookId: string;
};

export function ShareControls({
  appUrl,
  invites,
  isSampleMode = false,
  shareMode,
  yearbookId,
}: ShareControlsProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const shareUrl = `${appUrl}/write/${yearbookId}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopyMessage("Link copied!");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-stone-200 bg-white/85 p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yearbook-accent">
          Invite people to sign your yearbook
        </p>
        <h2 className="mt-2 text-2xl font-bold">Share your yearbook</h2>
      </div>

      <div>
        <p className="text-sm font-semibold text-stone-700">Share by Link</p>
        <div className="mt-2 flex flex-col gap-2 rounded-2xl bg-yearbook-paper p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all font-mono text-xs text-stone-600">{shareUrl}</p>
          <button
            className="rounded-full bg-yearbook-ink px-4 py-2 text-sm font-semibold text-white"
            onClick={copyLink}
            type="button"
          >
            Copy Link
          </button>
        </div>
        {shareMode === "invite_only" ? (
          <p className="mt-2 text-xs text-stone-600">Only people you&apos;ve invited can use this link.</p>
        ) : null}
        {copyMessage ? <p className="mt-2 text-sm font-semibold text-green-700">{copyMessage}</p> : null}
      </div>

      {isSampleMode ? (
        <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Sample mode is read-only. Copying links works, but invite and share mode changes are disabled.
        </p>
      ) : null}

      <form
        action={isSampleMode ? undefined : addInvite}
        className="rounded-2xl border border-stone-200 p-4"
        onSubmit={(event) => {
          if (isSampleMode) {
            event.preventDefault();
          }
        }}
      >
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <label className="block text-sm font-semibold text-stone-700">
          Invite by Username or User ID
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            disabled={isSampleMode}
            name="invitedUserId"
            placeholder="@username or Supabase user UUID"
          />
        </label>
        <button
          className="mt-3 rounded-full bg-yearbook-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSampleMode}
        >
          Invite
        </button>
        <p className="mt-2 text-xs text-stone-500">
          Username lookup will be wired when the profile search API is implemented.
        </p>
      </form>

      {invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-stone-700">Invited users</p>
          {invites.map((invite) => (
            <form
              action={isSampleMode ? undefined : revokeInvite}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
              key={invite.id}
              onSubmit={(event) => {
                if (isSampleMode) {
                  event.preventDefault();
                }
              }}
            >
              <input name="yearbookId" type="hidden" value={yearbookId} />
              <input name="invitedUserId" type="hidden" value={invite.invitedUserId} />
              <span className="truncate font-mono text-xs">{invite.invitedUserId}</span>
              <button className="font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={isSampleMode}>
                Revoke
              </button>
            </form>
          ))}
        </div>
      ) : null}

      <form
        action={isSampleMode ? undefined : updateShareMode}
        className="rounded-2xl bg-yearbook-paper p-4"
        onSubmit={(event) => {
          if (isSampleMode) {
            event.preventDefault();
          }
        }}
      >
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <p className="text-sm font-semibold text-stone-700">Share mode</p>
        <div className="mt-3 grid gap-2">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              defaultChecked={shareMode === "link"}
              disabled={isSampleMode}
              name="shareMode"
              type="radio"
              value="link"
            />
            Anyone with link
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              defaultChecked={shareMode === "invite_only"}
              disabled={isSampleMode}
              name="shareMode"
              type="radio"
              value="invite_only"
            />
            Invite only
          </label>
        </div>
        <button
          className="mt-3 rounded-full border border-yearbook-accent px-4 py-2 text-sm font-semibold text-yearbook-accent disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSampleMode}
        >
          Save share mode
        </button>
      </form>
    </section>
  );
}
