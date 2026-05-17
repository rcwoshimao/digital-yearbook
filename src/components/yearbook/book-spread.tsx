import type { ReactNode } from "react";
import { BOOK_HEIGHT, BOOK_WIDTH } from "@/components/yearbook/flipbook-viewer";
import { BookPage } from "@/components/yearbook/book-page";
import { defaultYearbookPageStyle } from "@/lib/yearbook/page-style";

const blankPageStyle = {
  ...defaultYearbookPageStyle,
  background_color: "#fffdf5",
  pattern: "none" as const,
};

type BookSpreadLayoutProps = {
  children: ReactNode;
  variant: "cover" | "spread" | "back";
};

export function BookSpreadLayout({ children, variant }: BookSpreadLayoutProps) {
  if (variant === "spread") {
    return (
      <div className="flex h-full w-full" style={{ width: BOOK_WIDTH * 2 }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      style={{ height: BOOK_HEIGHT, width: BOOK_WIDTH * 2 }}
    >
      <div
        className="absolute left-1/2 h-full -translate-x-1/2"
        style={{ width: BOOK_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}

export function SpreadPageSlot({ children }: { children: ReactNode }) {
  return (
    <div
      className="h-full shrink-0 border-stone-300/40 [&:not(:first-child)]:border-l"
      style={{ width: BOOK_WIDTH }}
    >
      {children}
    </div>
  );
}

export function BlankSpreadPage() {
  return (
    <SpreadPageSlot>
      <BookPage styleConfig={blankPageStyle}>
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-8 text-center">
          <p
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[7rem] leading-none text-stone-300/25"
          >
            ✦
          </p>
          <p className="relative text-xs uppercase tracking-[0.35em] text-stone-400/80">
            Yearbook
          </p>
          <div className="relative my-6 h-px w-12 bg-stone-300/50" />
          <p className="relative max-w-[12rem] font-serif text-sm italic text-stone-400/70">
            A page waiting for the next memory
          </p>
        </div>
      </BookPage>
    </SpreadPageSlot>
  );
}
