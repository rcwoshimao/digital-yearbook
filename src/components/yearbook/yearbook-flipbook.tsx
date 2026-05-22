"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BlankSpreadPage,
  BookSpreadLayout,
  SpreadPageSlot,
} from "@/components/yearbook/book-spread";
import { BookPage } from "@/components/yearbook/book-page";
import { EntryPageContent } from "@/components/yearbook/entry-page-content";
import { BackCoverPage, CoverPage } from "@/components/yearbook/yearbook-cover-page";
import { FlipbookViewer, useIsMobileBook } from "@/components/yearbook/flipbook-viewer";
import type { YearbookEntry } from "@/lib/types/yearbook";
import {
  getSpreads,
  type BookSpreadModel,
  type ContentSpreadLeft,
} from "@/lib/yearbook/get-spreads";
import {
  defaultYearbookPageStyle,
  normalizeYearbookPageStyle,
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
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState<FlipDirection>("next");
  const isMobile = useIsMobileBook();
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
  const spreadModels = useMemo(() => getSpreads(filteredEntries), [filteredEntries]);
  const spreads = useMemo(
    () =>
      isMobile
        ? buildMobileViews(spreadModels, {
            classLabel,
            ownerName,
            ownerUniversity,
            shareUrl,
          })
        : buildSpreadViews(spreadModels, {
            classLabel,
            ownerName,
            ownerUniversity,
            shareUrl,
          }),
    [classLabel, isMobile, ownerName, ownerUniversity, shareUrl, spreadModels],
  );
  const totalSpreads = spreads.length;
  const currentSpread = spreadIndex + 1;

  const flipPrev = useCallback(() => {
    setSpreadIndex((index) => {
      if (index <= 0) {
        return index;
      }

      setDirection("prev");
      return index - 1;
    });
  }, []);

  const flipNext = useCallback(() => {
    setSpreadIndex((index) => {
      if (index >= totalSpreads - 1) {
        return index;
      }

      setDirection("next");
      return index + 1;
    });
  }, [totalSpreads]);

  useEffect(() => {
    setSpreadIndex((index) => Math.min(index, Math.max(0, spreads.length - 1)));
  }, [spreads.length]);

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
        <FlipbookViewer
          direction={direction}
          isMobile={isMobile}
          spreadIndex={spreadIndex}
          spreads={spreads}
        />
      )}
      {shouldRenderBook ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <FlipButton disabled={spreadIndex === 0} label="Previous spread" onClick={flipPrev}>
            ‹
          </FlipButton>
          <p className="text-sm font-semibold text-stone-600">
            {currentSpread} / {totalSpreads}
          </p>
          <FlipButton
            disabled={spreadIndex >= totalSpreads - 1}
            label="Next spread"
            onClick={flipNext}
          >
            ›
          </FlipButton>
        </div>
      ) : null}
    </div>
  );
}

type SpreadViewContext = {
  classLabel: string;
  ownerName: string;
  ownerUniversity?: string | null;
  shareUrl: string;
};

function buildSpreadViews(models: BookSpreadModel[], context: SpreadViewContext) {
  return models.map((model, index) => renderSpread(model, context, `spread-${index}`));
}

function buildMobileViews(models: BookSpreadModel[], context: SpreadViewContext) {
  const pages: React.ReactNode[] = [];

  models.forEach((model, index) => {
    if (model.kind === "cover") {
      pages.push(
        <CoverPage
          key={`mobile-cover-${index}`}
          classLabel={context.classLabel}
          ownerName={context.ownerName}
          ownerUniversity={context.ownerUniversity}
        />,
      );
      return;
    }

    if (model.kind === "back") {
      pages.push(<BackCoverPage key={`mobile-back-${index}`} ownerName={context.ownerName} />);
      return;
    }

    pages.push(renderContentPage(model.left, context, `mobile-left-${index}`));

    if (model.right) {
      pages.push(<EntryPage entry={model.right} key={`mobile-right-${index}`} />);
    } else {
      pages.push(<BlankSpreadPage key={`mobile-blank-${index}`} />);
    }
  });

  return pages;
}

function renderSpread(model: BookSpreadModel, context: SpreadViewContext, key: string) {
  if (model.kind === "cover") {
    return (
      <BookSpreadLayout key={key} variant="cover">
        <CoverPage
          classLabel={context.classLabel}
          ownerName={context.ownerName}
          ownerUniversity={context.ownerUniversity}
        />
      </BookSpreadLayout>
    );
  }

  if (model.kind === "back") {
    return (
      <BookSpreadLayout key={key} variant="back">
        <BackCoverPage ownerName={context.ownerName} />
      </BookSpreadLayout>
    );
  }

  return (
    <BookSpreadLayout key={key} variant="spread">
      <SpreadPageSlot>{renderContentPage(model.left, context, `${key}-left`)}</SpreadPageSlot>
      {model.right ? (
        <SpreadPageSlot>
          <EntryPage entry={model.right} />
        </SpreadPageSlot>
      ) : (
        <BlankSpreadPage />
      )}
    </BookSpreadLayout>
  );
}

function renderContentPage(left: ContentSpreadLeft, context: SpreadViewContext, key: string) {
  if (left === "empty") {
    return <EmptyPage key={key} shareUrl={context.shareUrl} />;
  }

  return <EntryPage entry={left} key={key} />;
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
  if (entry.pageImageUrl) {
    return (
      <div className="h-full w-full overflow-hidden">
        <EntryPageContent entry={entry} />
      </div>
    );
  }

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
