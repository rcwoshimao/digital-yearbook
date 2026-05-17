"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntryCard } from "@/components/yearbook/entry-card";
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

type FlipBookRef = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
  };
};

type FlipEvent = {
  data: number;
};

const PAGE_WIDTH = 550;
const PAGE_HEIGHT = 733;
const bookStyle = {};

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState({
    height: PAGE_HEIGHT,
    width: PAGE_WIDTH,
  });
  const bookRef = useRef<FlipBookRef>(null);
  const flipPrev = useCallback(() => bookRef.current?.pageFlip().flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip().flipNext(), []);
  const handleFlip = useCallback((event: FlipEvent) => setCurrentPage(event.data + 1), []);
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
  const bookPages = useMemo(() => {
    const coverPage = (
      <PageWrapper key="cover">
        <CoverPage classLabel={classLabel} ownerName={ownerName} ownerUniversity={ownerUniversity} />
      </PageWrapper>
    );
    const contentPages = isEmptyYearbook
      ? [
          <PageWrapper key="empty">
            <EmptyPage shareUrl={shareUrl} />
          </PageWrapper>,
        ]
      : filteredEntries.map((entry) => (
            <PageWrapper key={entry.id}>
              <EntryCard entry={entry} />
            </PageWrapper>
        ));
    const paddedContentPages =
      contentPages.length % 2 === 0
        ? contentPages
        : [
            ...contentPages,
            <PageWrapper key="blank-before-back-cover">
              <BlankPage />
            </PageWrapper>,
          ];
    const backCoverPage = (
      <PageWrapper key="back-cover">
        <BackCover ownerName={ownerName} />
      </PageWrapper>
    );

    return [coverPage, ...paddedContentPages, backCoverPage];
  }, [classLabel, filteredEntries, isEmptyYearbook, ownerName, ownerUniversity, shareUrl]);
  const totalPages = bookPages.length;

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

  useEffect(() => {
    function updatePageSize() {
      const viewportWidth = window.innerWidth;
      const nextWidth =
        viewportWidth >= 1024 ? PAGE_WIDTH : Math.min(viewportWidth - 32, viewportWidth >= 640 ? 420 : 360);

      const nextHeight = Math.round(nextWidth * (PAGE_HEIGHT / PAGE_WIDTH));

      setPageSize((currentSize) => {
        if (currentSize.width === nextWidth && currentSize.height === nextHeight) {
          return currentSize;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    }

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

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
        <HTMLFlipBook
          autoSize={false}
          className="mx-auto mt-12"
          clickEventForward
          disableFlipByClick={false}
          drawShadow={true}
          flippingTime={700}
          height={pageSize.height}
          maxHeight={PAGE_HEIGHT}
          maxShadowOpacity={0.35}
          maxWidth={PAGE_WIDTH}
          minHeight={420}
          minWidth={300}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          ref={bookRef}
          renderOnlyPageLengthChange
          showCover={true}
          showPageCorners
          size="fixed"
          startPage={0}
          startZIndex={0}
          style={bookStyle}
          swipeDistance={30}
          useMouseEvents
          usePortrait={false}
          width={pageSize.width}
        >
          {bookPages}
        </HTMLFlipBook>
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

const PageWrapper = forwardRef<HTMLDivElement, { children: React.ReactNode }>(function PageWrapper(
  { children },
  ref,
) {
  return (
    <div className="bg-[#6f4728] p-3" ref={ref}>
      <div className="h-full overflow-hidden rounded-2xl bg-yearbook-paper shadow-inner">{children}</div>
    </div>
  );
});

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
    <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#9b6a3e,#5d391f_58%,#2f2118)] p-10 text-center text-white">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[2rem] border border-white/25 p-8 shadow-inner">
        <p className="font-serif text-sm uppercase tracking-[0.35em] text-white/70">Digital Yearbook</p>
        <h2 className="mt-8 font-serif text-5xl font-black leading-tight">{ownerName}</h2>
        <p className="mt-4 text-2xl font-semibold text-white/85">{classLabel}</p>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/60">
          {ownerUniversity ?? "Graduation Memories"}
        </p>
      </div>
    </div>
  );
}

function BackCover({ ownerName }: { ownerName: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_bottom,#8f5f35,#3f291a)] p-10 text-center text-white">
      <div>
        <p className="font-serif text-4xl font-black">The End</p>
        <p className="mt-4 text-sm uppercase tracking-[0.24em] text-white/65">
          {ownerName}&apos;s yearbook
        </p>
      </div>
    </div>
  );
}

function EmptyPage({ shareUrl }: { shareUrl: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-yearbook-paper p-10 text-center">
      <p className="font-serif text-3xl font-black text-yearbook-ink">
        No one has signed yet.
      </p>
      <p className="mt-3 max-w-xs text-stone-600">Share your link and come back!</p>
      <div className="mt-8 w-full rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold text-stone-700">Share link</p>
        <p className="mt-2 break-all font-mono text-xs text-yearbook-accent">{shareUrl}</p>
      </div>
    </div>
  );
}

function BlankPage() {
  return <div className="h-full bg-yearbook-paper" />;
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
