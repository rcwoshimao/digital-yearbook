"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BOOK_WIDTH, FlipbookViewer, useIsMobileBook } from "@/components/yearbook/flipbook-viewer";
import { BookSpreadLayout } from "@/components/yearbook/book-spread";

const SAMPLE_COVER = {
  src: "/assets/sample/sample0.png",
  alt: "Sample yearbook cover — Jane Doe, Class of 2026",
} as const;

const SAMPLE_BACK = {
  src: "/assets/sample/sample5.png",
  alt: "Sample yearbook back cover",
} as const;

const SAMPLE_PAGES = [
  { src: "/assets/sample/sample1.png", alt: "Sample signed page from Jamie" },
  { src: "/assets/sample/sample2.png", alt: "Sample signed page from Riley" },
  { src: "/assets/sample/sample3.png", alt: "Sample signed page from Jordan" },
  { src: "/assets/sample/sample4.png", alt: "Sample signed page from Tom" },
] as const;

/** Login sample only — no gutter border between spread pages. */
const SAMPLE_PAGE_SHADOW = "0 10px 36px rgba(0, 0, 0, 0.55)";

type FlipDirection = "next" | "prev";

function SampleImagePage({ alt, src }: { alt: string; src: string }) {
  return (
    <div
      className="h-full w-full overflow-hidden bg-white"
      style={{ boxShadow: SAMPLE_PAGE_SHADOW }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} className="block h-full w-full object-cover" draggable={false} src={src} />
    </div>
  );
}

function SampleSpreadPageSlot({ children }: { children: ReactNode }) {
  return (
    <div className="h-full shrink-0" style={{ width: BOOK_WIDTH }}>
      {children}
    </div>
  );
}

function buildDesktopSpreads(): ReactNode[] {
  const [page1, page2, page3, page4] = SAMPLE_PAGES;

  return [
    <BookSpreadLayout key="cover" variant="cover">
      <SampleImagePage alt={SAMPLE_COVER.alt} src={SAMPLE_COVER.src} />
    </BookSpreadLayout>,
    <BookSpreadLayout key="spread-1" variant="spread">
      <SampleSpreadPageSlot>
        <SampleImagePage alt={page1.alt} src={page1.src} />
      </SampleSpreadPageSlot>
      <SampleSpreadPageSlot>
        <SampleImagePage alt={page2.alt} src={page2.src} />
      </SampleSpreadPageSlot>
    </BookSpreadLayout>,
    <BookSpreadLayout key="spread-2" variant="spread">
      <SampleSpreadPageSlot>
        <SampleImagePage alt={page3.alt} src={page3.src} />
      </SampleSpreadPageSlot>
      <SampleSpreadPageSlot>
        <SampleImagePage alt={page4.alt} src={page4.src} />
      </SampleSpreadPageSlot>
    </BookSpreadLayout>,
    <BookSpreadLayout key="back" variant="back">
      <SampleImagePage alt={SAMPLE_BACK.alt} src={SAMPLE_BACK.src} />
    </BookSpreadLayout>,
  ];
}

function buildMobileSpreads(): ReactNode[] {
  const pages: ReactNode[] = [
    <div key="mobile-cover" className="h-full w-full overflow-hidden">
      <SampleImagePage alt={SAMPLE_COVER.alt} src={SAMPLE_COVER.src} />
    </div>,
  ];

  SAMPLE_PAGES.forEach((page, index) => {
    pages.push(
      <div key={`mobile-page-${index}`} className="h-full w-full overflow-hidden">
        <SampleImagePage alt={page.alt} src={page.src} />
      </div>,
    );
  });

  pages.push(
    <div key="mobile-back" className="h-full w-full overflow-hidden">
      <SampleImagePage alt={SAMPLE_BACK.alt} src={SAMPLE_BACK.src} />
    </div>,
  );

  return pages;
}

function FlipButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yearbook-ink text-2xl font-semibold text-white shadow-sm transition hover:bg-yearbook-accent disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function SampleFlipbook() {
  const isMobile = useIsMobileBook();
  const spreads = useMemo(
    () => (isMobile ? buildMobileSpreads() : buildDesktopSpreads()),
    [isMobile],
  );
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState<FlipDirection>("next");
  const totalSpreads = spreads.length;

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
    <>
      <div className="px-6 pb-4 pt-8">
        <FlipbookViewer
          clipStage={false}
          containerClassName="mt-0"
          direction={direction}
          isMobile={isMobile}
          spreadIndex={spreadIndex}
          spreads={spreads}
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <FlipButton disabled={spreadIndex === 0} label="Previous page" onClick={flipPrev}>
          ‹
        </FlipButton>
        <p className="text-sm font-semibold text-stone-600">
          {spreadIndex + 1} / {totalSpreads}
        </p>
        <FlipButton disabled={spreadIndex >= totalSpreads - 1} label="Next page" onClick={flipNext}>
          ›
        </FlipButton>
      </div>
    </>
  );
}
