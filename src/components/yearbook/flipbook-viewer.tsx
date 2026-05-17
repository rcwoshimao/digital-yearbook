"use client";

import { AnimatePresence, motion, type Easing } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export const BOOK_WIDTH = 550;
export const BOOK_HEIGHT = 733;

const FLIP_DURATION = 0.55;
const FLIP_EASE: Easing = [0.645, 0.045, 0.355, 1];

type FlipDirection = "next" | "prev";

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
        className="relative"
        style={{
          height: BOOK_HEIGHT,
          perspective: 1800,
          width: BOOK_WIDTH,
        }}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={pageIndex}
            animate={{ opacity: 1, rotateY: 0 }}
            className="absolute inset-0 h-full w-full"
            custom={direction}
            exit={{
              opacity: 0.6,
              rotateY: direction === "next" ? -90 : 90,
            }}
            initial={{
              opacity: 0.6,
              rotateY: direction === "next" ? 90 : -90,
            }}
            style={{
              transformOrigin: direction === "next" ? "left center" : "right center",
              transformStyle: "preserve-3d",
            }}
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
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
    <div className="mx-auto mt-12" style={{ height: BOOK_HEIGHT * scale, overflow: "hidden", width: maxWidth }}>
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
