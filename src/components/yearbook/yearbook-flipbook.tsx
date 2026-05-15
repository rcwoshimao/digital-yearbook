"use client";

import HTMLFlipBook from "react-pageflip";
import { useEffect, useMemo, useRef, useState } from "react";
import { EntryCard } from "@/components/yearbook/entry-card";
import type { YearbookEntry } from "@/lib/types/yearbook";

type YearbookFlipbookProps = {
  entries: YearbookEntry[];
};

export function YearbookFlipbook({ entries }: YearbookFlipbookProps) {
  const [query, setQuery] = useState("");
  const bookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } }>(null);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => entry.authorName.toLowerCase().includes(normalizedQuery));
  }, [entries, query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        bookRef.current?.pageFlip().flipNext();
      }

      if (event.key === "ArrowLeft") {
        bookRef.current?.pageFlip().flipPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-stone-600">
        No one has written in your yearbook yet. Share your write link to get started.
      </p>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700" htmlFor="entry-search">
        Search by author
      </label>
      <input
        id="entry-search"
        className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-yearbook-accent"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search entries..."
        type="search"
        value={query}
      />
      {filteredEntries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-6 text-center text-stone-600">
          No entries match that author.
        </p>
      ) : (
        <div className="mt-6">
          <HTMLFlipBook
            autoSize
            className="mx-auto"
            clickEventForward
            disableFlipByClick={false}
            drawShadow
            flippingTime={700}
            height={640}
            maxHeight={720}
            maxShadowOpacity={0.25}
            maxWidth={960}
            minHeight={420}
            minWidth={300}
            mobileScrollSupport
            ref={bookRef}
            renderOnlyPageLengthChange
            showCover={false}
            showPageCorners
            size="stretch"
            startPage={0}
            startZIndex={0}
            style={{ margin: "0 auto" }}
            swipeDistance={30}
            useMouseEvents
            usePortrait
            width={420}
          >
            {filteredEntries.map((entry) => (
              <div className="bg-yearbook-paper p-3" key={entry.id}>
                <EntryCard entry={entry} />
              </div>
            ))}
          </HTMLFlipBook>
          <div className="mt-4 flex justify-center gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-full bg-yearbook-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
