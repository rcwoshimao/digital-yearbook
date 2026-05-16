"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createEntry } from "@/app/yearbook/[yearbookId]/write/actions";

type WriteEntryFormProps = {
  authorClass: string | null;
  authorName: string;
  authorUniversity: string | null;
  yearbookId: string;
};

export function WriteEntryForm({
  authorClass,
  authorName,
  authorUniversity,
  yearbookId,
}: WriteEntryFormProps) {
  const [contentText, setContentText] = useState("");
  const { acceptedFiles, getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });
  const previews = useMemo(
    () =>
      acceptedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [acceptedFiles],
  );
  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);
  const canSubmit = contentText.trim().length > 0;

  return (
    <form
      action={createEntry}
      className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200"
      onSubmit={(event) => {
        if (!canSubmit || !window.confirm("Once submitted, you cannot edit or delete this entry. Are you sure?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="yearbookId" type="hidden" value={yearbookId} />
      <div>
        <label className="block text-sm font-semibold text-stone-700" htmlFor="contentText">
          Your message
        </label>
        <textarea
          id="contentText"
          name="contentText"
          className="mt-2 min-h-56 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-yearbook-accent"
          onChange={(event) => setContentText(event.target.value)}
          placeholder="Write your graduation memory..."
          value={contentText}
        />
      </div>
      <div
        {...getRootProps()}
        className="mt-6 cursor-pointer rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600 transition hover:border-yearbook-accent"
      >
        <input {...getInputProps({ name: "images" })} />
        <span className="font-semibold text-stone-700">+ Add Images</span>
        <span className="mt-1 block">
          {isDragActive ? "Drop images here." : "Drag and drop or click to upload. Max 5 images, 5MB each."}
        </span>
      </div>
      {previews.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview) => (
            <img
              alt={preview.name}
              className="h-28 w-full rounded-2xl object-cover"
              key={preview.url}
              src={preview.url}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-6 rounded-2xl bg-yearbook-paper p-4">
        <p className="text-sm font-semibold text-stone-700">From</p>
        <p className="mt-1 text-lg font-bold">{authorName}</p>
        <p className="text-sm text-stone-600">
          {[authorUniversity, authorClass].filter(Boolean).join(" · ") || "No school details yet"}
        </p>
        <p className="mt-3 text-xs font-semibold text-amber-800">
          Once submitted, this entry cannot be edited.
        </p>
      </div>
      <button
        className="mt-6 rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
      >
        Submit Entry
      </button>
    </form>
  );
}
