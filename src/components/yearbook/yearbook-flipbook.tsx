"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { YearbookEntry } from "@/lib/types/yearbook";

type YearbookFlipbookProps = {
  entries: YearbookEntry[];
  ownerClass?: string | null;
  ownerName: string;
  ownerUniversity?: string | null;
  shareUrl: string;
  toolbarEnd?: React.ReactNode;
  toolbarStart?: React.ReactNode;
};

export function YearbookFlipbook({
  entries,
  ownerClass,
  ownerName,
  ownerUniversity,
  shareUrl,
  toolbarEnd,
  toolbarStart,
}: YearbookFlipbookProps) {
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => entry.authorName.toLowerCase().includes(normalizedQuery));
  }, [entries, query]);
  const isEmptyYearbook = entries.length === 0;
  const hasSearchResults = filteredEntries.length > 0;
  const shouldRenderBook = isEmptyYearbook || hasSearchResults;
  const classLabel = ownerClass ? `Class of ${ownerClass}` : "Class Memories";
  const pages = useMemo(() => {
    const list: React.ReactNode[] = [
      <CoverPage
        key="cover"
        classLabel={classLabel}
        ownerName={ownerName}
        ownerUniversity={ownerUniversity}
      />,
    ];

    if (isEmptyYearbook) {
      list.push(<EmptyPage key="empty" shareUrl={shareUrl} />);
    } else {
      filteredEntries.forEach((entry) => {
        list.push(<EntryPage entry={entry} key={entry.id} />);
      });
    }

    list.push(<BackCover key="back-cover" ownerName={ownerName} />);

    return list;
  }, [classLabel, filteredEntries, isEmptyYearbook, ownerName, ownerUniversity, shareUrl]);
  const totalPages = pages.length;
  const currentPage = pageIndex + 1;

  const flipPrev = useCallback(() => {
    setPageIndex((index) => Math.max(0, index - 1));
  }, []);

  const flipNext = useCallback(() => {
    setPageIndex((index) => Math.min(totalPages - 1, index + 1));
  }, [totalPages]);

  useEffect(() => {
    setPageIndex((index) => Math.min(index, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        flipNext();
      }

      if (event.key === "ArrowLeft") {
        flipPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipNext, flipPrev]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {toolbarStart ? <div className="shrink-0">{toolbarStart}</div> : null}
        <input
          id="entry-search"
          aria-label="Search by author"
          className="min-w-0 flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-yearbook-accent"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by author"
          type="search"
          value={query}
        />
        {toolbarEnd ? <div className="shrink-0">{toolbarEnd}</div> : null}
      </div>
      {!shouldRenderBook ? (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-center text-sm text-stone-600">
          No entries match that author.
        </div>
      ) : (
        <div>{pages[pageIndex]}</div>
      )}
      {shouldRenderBook ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <FlipButton label="Previous page" onClick={flipPrev}>
            ‹
          </FlipButton>
          <p className="text-sm font-semibold text-stone-600">
            {currentPage} / {totalPages}
          </p>
          <FlipButton label="Next page" onClick={flipNext}>
            ›
          </FlipButton>
        </div>
      ) : null}
    </div>
  );
}

function CoverPage({
  classLabel,
  ownerName,
  ownerUniversity,
}: {
  classLabel: string;
  ownerName: string;
  ownerUniversity?: string | null;
}) {
  return (
    <div>
      <p>Digital Yearbook</p>
      <p>{ownerName}</p>
      <p>{classLabel}</p>
      <p>{ownerUniversity ?? "Graduation Memories"}</p>
    </div>
  );
}

function BackCover({ ownerName }: { ownerName: string }) {
  return (
    <div>
      <p>The End</p>
      <p>{ownerName}&apos;s yearbook</p>
    </div>
  );
}

function EmptyPage({ shareUrl }: { shareUrl: string }) {
  return (
    <div>
      <p>No one has signed yet.</p>
      <p>Share your link and come back!</p>
      <p>{shareUrl}</p>
    </div>
  );
}

function EntryPage({ entry }: { entry: YearbookEntry }) {
  const meta = [entry.authorClass, entry.authorUniversity].filter(Boolean).join(" · ");

  return (
    <div>
      <p>{entry.authorName}</p>
      {meta ? <p>{meta}</p> : null}
      <p>{entry.contentText}</p>
    </div>
  );
}

function FlipButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yearbook-ink text-3xl font-semibold text-white shadow-sm transition hover:bg-yearbook-accent"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
