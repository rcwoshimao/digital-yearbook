/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import { SignedPageMetadata } from "@/components/yearbook/signed-page-metadata";
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
  if (entry.pageImageUrl) {
    return (
      <article className="relative h-full w-full overflow-hidden">
        <img
          alt={`${entry.authorName}'s yearbook page`}
          className="block h-full w-full"
          draggable={false}
          src={entry.pageImageUrl}
        />
        {showSignedPageMetadata ? (
          <SignedPageMetadata
            authorClass={entry.authorClass}
            authorName={entry.authorName}
            authorUniversity={entry.authorUniversity}
            createdAt={entry.createdAt}
          />
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

  const meta = [entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ");

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
