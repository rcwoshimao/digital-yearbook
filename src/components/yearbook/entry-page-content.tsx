/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";

type EntryPageContentProps = {
  entry: YearbookEntry;
  /** When false, signed page images export without the author overlay footer. */
  showSignedPageMetadata?: boolean;
};

function chromelessPdfUrl(url: string) {
  const hash = "toolbar=0&navpanes=0&scrollbar=0&view=Fit";
  return url.includes("#") ? `${url}&${hash}` : `${url}#${hash}`;
}

export function EntryPageContent({ entry, showSignedPageMetadata = true }: EntryPageContentProps) {
  const meta = [entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ");

  if (entry.pageImageUrl) {
    return (
      <article className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <img
          alt={`${entry.authorName}'s yearbook page`}
          className="h-full w-full object-contain"
          draggable={false}
          src={entry.pageImageUrl}
        />
        {showSignedPageMetadata ? (
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 to-transparent px-3 pb-2 pt-6 text-xs opacity-70">
            <p className="font-semibold">{entry.authorName}</p>
            {meta ? <p>{meta}</p> : null}
            <p>Written on {format(entry.createdAt, "PPP")}</p>
          </footer>
        ) : null}
      </article>
    );
  }

  if (entry.pdfUrl) {
    return (
      <article className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <iframe
          className="h-full w-full border-0"
          src={chromelessPdfUrl(entry.pdfUrl)}
          title={`${entry.authorName}'s yearbook page`}
        />
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
