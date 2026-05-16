"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WriteHubSearch() {
  const router = useRouter();
  const [sharedLink, setSharedLink] = useState("");
  const [message, setMessage] = useState("");

  function openSharedLink() {
    const trimmed = sharedLink.trim();
    const match = trimmed.match(/\/write\/([^/?#]+)/) ?? trimmed.match(/^([0-9a-f-]{20,})$/i);
    const yearbookId = match?.[1];

    if (!yearbookId) {
      setMessage("Paste a valid /write/[yearbook_id] link.");
      return;
    }

    router.push(`/write/${yearbookId}`);
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-dashed border-stone-300 p-5">
        <p className="text-sm font-semibold text-stone-700">Find someone</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-3 text-sm"
            disabled
            placeholder="@username or user ID"
          />
          <button
            className="rounded-full bg-stone-300 px-5 py-3 text-sm font-semibold text-stone-600"
            disabled
            type="button"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Profile lookup will be wired when the frontend gets the search API.
        </p>
      </div>

      <div className="text-center text-sm font-semibold text-stone-500">
        or paste a link they shared with you
      </div>

      <div className="rounded-2xl bg-yearbook-paper p-5">
        <label className="block text-sm font-semibold text-stone-700">
          Shared yearbook link
          <input
            className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-3 text-sm"
            onChange={(event) => setSharedLink(event.target.value)}
            placeholder="https://yourapp.com/write/yearbook-id"
            value={sharedLink}
          />
        </label>
        <button
          className="mt-3 rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
          onClick={openSharedLink}
          type="button"
        >
          Open yearbook
        </button>
        {message ? <p className="mt-2 text-sm font-semibold text-red-700">{message}</p> : null}
      </div>
    </div>
  );
}
