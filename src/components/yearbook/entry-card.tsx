/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";

type EntryCardProps = {
  entry: YearbookEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-yearbook-paper p-5 shadow-sm">
      <header className="border-b border-stone-200 pb-4">
        <h3 className="text-lg font-bold">{entry.authorName}</h3>
        <p className="text-sm text-stone-600">
          {[entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ")}
        </p>
      </header>
      <p className="mt-4 whitespace-pre-wrap leading-7 text-stone-800">{entry.contentText}</p>
      {entry.imageUrls.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {entry.imageUrls.map((imageUrl) => (
            <img
              alt={`Image from ${entry.authorName}'s yearbook entry`}
              className="max-h-72 w-full rounded-2xl object-cover"
              key={imageUrl}
              src={imageUrl}
            />
          ))}
        </div>
      ) : null}
      <footer className="mt-6 text-sm text-stone-500">
        Written on {format(entry.createdAt, "PPP")}
      </footer>
    </article>
  );
}
