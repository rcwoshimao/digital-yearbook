/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { fontFamilyByStyle, normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";

type EntryCardProps = {
  entry: YearbookEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  const styleConfig = normalizeYearbookPageStyle(entry.styleConfig);
  const patternClass =
    styleConfig.pattern === "none" ? "" : `yearbook-pattern-${styleConfig.pattern}`;
  const borderClass =
    styleConfig.border === "none" || styleConfig.border === "corner"
      ? ""
      : `yearbook-border-${styleConfig.border}`;

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/70 p-7 shadow-sm ${patternClass} ${borderClass}`}
      style={{
        backgroundColor: styleConfig.background_color,
        color: styleConfig.ink_color,
        fontFamily: fontFamilyByStyle[styleConfig.font],
      }}
    >
      {styleConfig.border === "corner" ? <CornerMarks /> : null}
      <header className="relative border-b border-current/20 pb-4">
        <h3 className="text-2xl font-bold">{entry.authorName}</h3>
        <p className="text-sm opacity-70">
          {[entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ")}
        </p>
      </header>
      <p className="relative mt-5 whitespace-pre-wrap text-lg leading-8">{entry.contentText}</p>
      {entry.imageUrls.length > 0 ? (
        <div className="relative mt-4 grid gap-3">
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
      <footer className="relative mt-auto pt-6 text-sm opacity-60">
        Written on {format(entry.createdAt, "PPP")}
      </footer>
    </article>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="absolute left-5 top-5 h-12 w-12 border-l-2 border-t-2 border-current/30" />
      <span className="absolute right-5 top-5 h-12 w-12 border-r-2 border-t-2 border-current/30" />
      <span className="absolute bottom-5 left-5 h-12 w-12 border-b-2 border-l-2 border-current/30" />
      <span className="absolute bottom-5 right-5 h-12 w-12 border-b-2 border-r-2 border-current/30" />
    </>
  );
}
