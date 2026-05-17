"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookPage } from "@/components/yearbook/book-page";
import { EntryPageContent } from "@/components/yearbook/entry-page-content";
import { FlipbookViewer } from "@/components/yearbook/flipbook-viewer";
import type { YearbookEntry } from "@/lib/types/yearbook";
import {
  defaultYearbookPageStyle,
  normalizeYearbookPageStyle,
  type YearbookPageStyle,
} from "@/lib/yearbook/page-style";

type YearbookFlipbookProps = {
  entries: YearbookEntry[];
  ownerClass?: string | null;
  ownerName: string;
  ownerUniversity?: string | null;
  shareUrl: string;
  toolbarEnd?: React.ReactNode;
  toolbarStart?: React.ReactNode;
};

type FlipDirection = "next" | "prev";

const coverStyleConfig: YearbookPageStyle = {
  background_color: "#1a2e4a",
  border: "none",
  font: "serif",
  ink_color: "#fffdf5",
  pattern: "none",
};

const backCoverStyleConfig: YearbookPageStyle = {
  background_color: "#1a2e4a",
  border: "none",
  font: "serif",
  ink_color: "#fffdf5",
  pattern: "none",
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
  const [direction, setDirection] = useState<FlipDirection>("next");
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
    setPageIndex((index) => {
      if (index <= 0) {
        return index;
      }

      setDirection("prev");
      return index - 1;
    });
  }, []);

  const flipNext = useCallback(() => {
    setPageIndex((index) => {
      if (index >= totalPages - 1) {
        return index;
      }

      setDirection("next");
      return index + 1;
    });
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
        <FlipbookViewer direction={direction} pageIndex={pageIndex} pages={pages} />
      )}
      {shouldRenderBook ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <FlipButton disabled={pageIndex === 0} label="Previous page" onClick={flipPrev}>
            ‹
          </FlipButton>
          <p className="text-sm font-semibold text-stone-600">
            {currentPage} / {totalPages}
          </p>
          <FlipButton disabled={pageIndex >= totalPages - 1} label="Next page" onClick={flipNext}>
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
    <BookPage styleConfig={coverStyleConfig}>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-12 text-center">
        <p className="text-sm uppercase tracking-[0.3em] opacity-60">{classLabel}</p>
        <h1 className="text-4xl font-bold leading-tight">{ownerName}</h1>
        <p className="text-base opacity-70">{ownerUniversity ?? "Graduation Memories"}</p>
        <div className="mt-8 h-px w-16 bg-current opacity-30" />
        <p className="mt-2 text-xs opacity-40">Your Yearbook</p>
      </div>
    </BookPage>
  );
}

function BackCover({ ownerName }: { ownerName: string }) {
  return (
    <BookPage styleConfig={backCoverStyleConfig}>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-12 text-center">
        <p className="text-3xl font-bold">The End</p>
        <p className="text-sm uppercase tracking-[0.24em] opacity-60">{ownerName}&apos;s yearbook</p>
      </div>
    </BookPage>
  );
}

function EmptyPage({ shareUrl }: { shareUrl: string }) {
  return (
    <BookPage styleConfig={defaultYearbookPageStyle}>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
        <p className="text-2xl font-bold">No one has signed yet.</p>
        <p className="max-w-xs text-base opacity-80">Share your link and come back!</p>
        <p className="mt-4 break-all font-mono text-xs opacity-70">{shareUrl}</p>
      </div>
    </BookPage>
  );
}

function EntryPage({ entry }: { entry: YearbookEntry }) {
  const styleConfig = normalizeYearbookPageStyle(entry.styleConfig);

  return (
    <BookPage styleConfig={styleConfig}>
      <EntryPageContent entry={entry} />
    </BookPage>
  );
}

function FlipButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yearbook-ink text-3xl font-semibold text-white shadow-sm transition hover:bg-yearbook-accent disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
