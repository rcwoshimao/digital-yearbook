"use client";

import { AnimatePresence, motion, type Easing, type Variants } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export const BOOK_WIDTH = 550;
export const BOOK_HEIGHT = 733;
export const SPREAD_WIDTH = BOOK_WIDTH * 2;
const MOBILE_BREAKPOINT = 640;

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
  isMobile: boolean;
  spreadIndex: number;
  spreads: ReactNode[];
  /** Busts motion cache when cover style changes without flipping pages. */
  spreadsVersion?: string;
};

export function useIsMobileBook() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function FlipbookViewer({
  direction,
  isMobile,
  spreadIndex,
  spreads,
  spreadsVersion,
}: FlipbookViewerProps) {
  const spread = spreads[spreadIndex];
  const stageWidth = isMobile ? BOOK_WIDTH : SPREAD_WIDTH;

  if (!spread) {
    return null;
  }

  return (
    <ResponsiveBook stageWidth={stageWidth}>
      <div
        className="relative overflow-hidden"
        style={{
          height: BOOK_HEIGHT,
          width: stageWidth,
        }}
      >
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={`${spreadIndex}-${spreadsVersion ?? "v0"}`}
            animate="center"
            className="absolute inset-0 h-full w-full"
            custom={direction}
            exit="exit"
            initial="enter"
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
            variants={pageVariants}
          >
            {spread}
          </motion.div>
        </AnimatePresence>
      </div>
    </ResponsiveBook>
  );
}

function ResponsiveBook({
  children,
  stageWidth,
}: {
  children: ReactNode;
  stageWidth: number;
}) {
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(stageWidth);

  useEffect(() => {
    function updateScale() {
      const nextContainerWidth = Math.min(stageWidth, window.innerWidth - 48);
      setContainerWidth(nextContainerWidth);
      setScale(nextContainerWidth / stageWidth);
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [stageWidth]);

  return (
    <div
      className="mx-auto mt-12"
      style={{ height: BOOK_HEIGHT * scale, width: containerWidth }}
    >
      <div
        style={{
          height: BOOK_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: stageWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}
