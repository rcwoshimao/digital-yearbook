"use client";

import { useRef, useState } from "react";

import { addInvite, revokeInvite, updateShareMode } from "@/app/dashboard/actions";
import { useNotification } from "@/components/providers/notification-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { YearbookInvite } from "@/lib/types/yearbook";

type ShareControlsProps = {
  appUrl: string;
  invites: YearbookInvite[];
  ownerUsername: string;
  returnPath?: string;
  shareMode: "link" | "invite_only";
  yearbookId: string;
};

export function ShareControls({
  appUrl,
  invites,
  ownerUsername,
  returnPath = "/dashboard",
  shareMode,
  yearbookId,
}: ShareControlsProps) {
  const { notifySuccess } = useNotification();
  const shareUrl = `${appUrl}/write/${ownerUsername}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    notifySuccess("Link copied!");
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
      </div>

      <form action={addInvite} className="rounded-2xl border border-stone-200 p-4">
        <input name="returnPath" type="hidden" value={returnPath} />
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <label className="block text-sm font-semibold text-stone-700">
          Invite by Username
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            name="username"
            placeholder="@username"
          />
        </label>
        <button
          className="mt-3 rounded-full bg-yearbook-accent px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Invite
        </button>
      </form>

      {invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-stone-700">Invited users</p>
          {invites.map((invite) => (
            <RevokeInviteRow
              invite={invite}
              key={invite.id}
              returnPath={returnPath}
              yearbookId={yearbookId}
            />
          ))}
        </div>
      ) : null}

      <form action={updateShareMode} className="rounded-2xl bg-yearbook-paper p-4">
        <input name="returnPath" type="hidden" value={returnPath} />
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <p className="text-sm font-semibold text-stone-700">Share mode</p>
        <div className="mt-3 grid gap-2">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input defaultChecked={shareMode === "link"} name="shareMode" type="radio" value="link" />
            Anyone with link
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              defaultChecked={shareMode === "invite_only"}
              name="shareMode"
              type="radio"
              value="invite_only"
            />
            Invite only
          </label>
        </div>
        <button
          className="mt-3 rounded-full border border-yearbook-accent px-4 py-2 text-sm font-semibold text-yearbook-accent"
          type="submit"
        >
          Save share mode
        </button>
      </form>
    </section>
  );
}

type RevokeInviteRowProps = {
  invite: YearbookInvite;
  returnPath: string;
  yearbookId: string;
};

function RevokeInviteRow({ invite, returnPath, yearbookId }: RevokeInviteRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        action={revokeInvite}
        className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
        ref={formRef}
      >
        <input name="returnPath" type="hidden" value={returnPath} />
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <input name="invitedUserId" type="hidden" value={invite.invitedUserId} />
        <span className="truncate text-sm font-semibold">@{invite.invitedUsername}</span>
        <button
          className="font-semibold text-red-700"
          onClick={() => setConfirmOpen(true)}
          type="button"
        >
          Revoke
        </button>
      </form>

      <Dialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke invite?</DialogTitle>
            <DialogDescription>
              @{invite.invitedUsername} will no longer be able to sign your yearbook using your
              share link. You can invite them again later.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setConfirmOpen(false);
                formRef.current?.requestSubmit();
              }}
              type="button"
            >
              Revoke
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
