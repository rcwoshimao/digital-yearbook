"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { profileSetupHintStorageKey } from "@/lib/profile/setup-hint";

type ProfileSetupHintDialogProps = {
  profileUsername: string;
  schoolIncomplete: boolean;
  shouldPrompt: boolean;
  userId: string;
};

export function ProfileSetupHintDialog({
  profileUsername,
  schoolIncomplete,
  shouldPrompt,
  userId,
}: ProfileSetupHintDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldPrompt) {
      return;
    }
    try {
      const dismissed = window.localStorage.getItem(profileSetupHintStorageKey(userId));
      if (!dismissed) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [shouldPrompt, userId]);

  function dismiss() {
    try {
      window.localStorage.setItem(profileSetupHintStorageKey(userId), "1");
    } catch {
      // Ignore storage failures; still close the dialog.
    }
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      dismiss();
      return;
    }
    setOpen(true);
  }

  if (!shouldPrompt) {
    return null;
  }

  const profileHref = `/profile/${profileUsername}`;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {schoolIncomplete ? "Add your school details" : "Welcome to your yearbook"}
          </DialogTitle>
          <DialogDescription>
            {schoolIncomplete ? (
              <>
                Your university and graduation year appear on your yearbook cover and on pages you
                sign. You can set or change your name, username, and school anytime in{" "}
                <Link className="font-semibold text-yearbook-accent underline" href={profileHref}>
                  Profile settings
                </Link>
                .
              </>
            ) : (
              <>
                You can update your display name, username, and school details anytime in{" "}
                <Link className="font-semibold text-yearbook-accent underline" href={profileHref}>
                  Profile settings
                </Link>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={dismiss}
            type="button"
          >
            Got it
          </button>
          {schoolIncomplete ? (
            <Link
              className="rounded-full bg-yearbook-accent px-4 py-2 text-center text-sm font-semibold text-white"
              href={profileHref}
              onClick={dismiss}
            >
              Open Profile settings
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
