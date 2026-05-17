"use client";

import { AnimatePresence, motion, type Easing, type Variants } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export const BOOK_WIDTH = 550;
export const BOOK_HEIGHT = 733;

const FLIP_DURATION = 0.45;
const FLIP_EASE: Easing = [0.645, 0.045, 0.355, 1];

type FlipDirection = "next" | "prev";

const pageVariants: Variants = {
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  enter: (direction: FlipDirection) => ({
    opacity: 0,
    scale: 0.96,
    x: direction === "next" ? 56 : -56,
  }),
  exit: (direction: FlipDirection) => ({
    opacity: 0,
    scale: 0.96,
    x: direction === "next" ? -56 : 56,
  }),
};

type FlipbookViewerProps = {
  direction: FlipDirection;
  pageIndex: number;
  pages: ReactNode[];
};

export function FlipbookViewer({ direction, pageIndex, pages }: FlipbookViewerProps) {
  const page = pages[pageIndex];

  if (!page) {
    return null;
  }

  return (
    <ResponsiveBook>
      <div
        className="relative overflow-hidden"
        style={{
          height: BOOK_HEIGHT,
          width: BOOK_WIDTH,
        }}
      >
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={pageIndex}
            animate="center"
            className="absolute inset-0 h-full w-full"
            custom={direction}
            exit="exit"
            initial="enter"
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
            variants={pageVariants}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </div>
    </ResponsiveBook>
  );
}

function ResponsiveBook({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [maxWidth, setMaxWidth] = useState(BOOK_WIDTH);

  useEffect(() => {
    function updateScale() {
      const nextMaxWidth = Math.min(BOOK_WIDTH, window.innerWidth - 48);
      setMaxWidth(nextMaxWidth);
      setScale(nextMaxWidth / BOOK_WIDTH);
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="mx-auto mt-12" style={{ height: BOOK_HEIGHT * scale, width: maxWidth }}>
      <div
        style={{
          height: BOOK_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: BOOK_WIDTH,
        }}
      >
        {children}
      </div>
    </div>
  );
}
