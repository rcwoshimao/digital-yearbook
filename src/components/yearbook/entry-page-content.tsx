/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";

type EntryPageContentProps = {
  entry: YearbookEntry;
};

export function EntryPageContent({ entry }: EntryPageContentProps) {
  const meta = [entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ");

  if (entry.pdfUrl) {
    return (
      <article className="flex h-full flex-col p-4">
        <header className="border-b border-current/20 pb-3">
          <h3 className="text-xl font-bold">{entry.authorName}</h3>
          {meta ? <p className="text-sm opacity-70">{meta}</p> : null}
        </header>
        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-current/10 bg-white">
          <iframe
            className="h-full w-full"
            src={entry.pdfUrl}
            title={`${entry.authorName}'s yearbook page`}
          />
        </div>
        <footer className="mt-4 text-sm opacity-60">Written on {format(entry.createdAt, "PPP")}</footer>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col p-8">
      <header className="border-b border-current/20 pb-4">
        <h3 className="text-2xl font-bold">{entry.authorName}</h3>
        {meta ? <p className="text-sm opacity-70">{meta}</p> : null}
      </header>
      <p className="mt-5 flex-1 whitespace-pre-wrap text-lg leading-8">{entry.contentText}</p>
      {entry.imageUrls.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {entry.imageUrls.map((imageUrl) => (
            <img
              alt={`Image from ${entry.authorName}'s yearbook entry`}
              className="max-h-56 w-full rounded-lg object-cover"
              key={imageUrl}
              src={imageUrl}
            />
          ))}
        </div>
      ) : null}
      <footer className="mt-6 text-sm opacity-60">Written on {format(entry.createdAt, "PPP")}</footer>
    </article>
  );
}
