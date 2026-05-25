"use client";

import { useState } from "react";
import { deleteMyYearbookEntry } from "@/app/yearbook/[yearbookId]/write/actions";

type RemoveYearbookEntryFormProps = {
  ownerUsername: string;
  yearbookId: string;
  variant?: "default" | "compact";
};

export function RemoveYearbookEntryForm({
  ownerUsername,
  yearbookId,
  variant = "default",
}: RemoveYearbookEntryFormProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    if (variant === "compact") {
      return (
        <button
          className="text-sm font-semibold text-red-800 underline decoration-red-300 underline-offset-2 hover:text-red-950"
          onClick={() => setConfirming(true)}
          type="button"
        >
          Stuck? Remove your previous signature
        </button>
      );
    }

    return (
      <button
        className="rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-50"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Remove my signature
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50/80 p-5 text-left">
      <p className="text-sm font-semibold text-red-900">Remove this signed page?</p>
      <p className="mt-2 text-sm text-red-800">
        This deletes your entry and uploaded page image from the yearbook. You can sign again
        afterward.
      </p>
      <form action={deleteMyYearbookEntry} className="mt-4 flex flex-wrap justify-center gap-3">
        <input name="ownerUsername" type="hidden" value={ownerUsername} />
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <button
          className="rounded-full bg-red-800 px-5 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Yes, remove
        </button>
        <button
          className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-900"
          onClick={() => setConfirming(false)}
          type="button"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
