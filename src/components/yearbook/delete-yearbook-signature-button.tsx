"use client";

import { deleteMyYearbookEntry } from "@/app/yearbook/[yearbookId]/write/actions";

type DeleteYearbookSignatureButtonProps = {
  ownerUsername: string;
  yearbookId: string;
};

export function DeleteYearbookSignatureButton({
  ownerUsername,
  yearbookId,
}: DeleteYearbookSignatureButtonProps) {
  return (
    <form
      action={deleteMyYearbookEntry}
      className="flex justify-center"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Delete your signature from this yearbook? This removes your page and image completely. You can design and sign again afterward.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="ownerUsername" type="hidden" value={ownerUsername} />
      <input name="yearbookId" type="hidden" value={yearbookId} />
      <button
        className="rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-50"
        type="submit"
      >
        Delete my signature
      </button>
    </form>
  );
}
