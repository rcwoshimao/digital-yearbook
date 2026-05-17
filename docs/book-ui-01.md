# Cursor Prompt: Replace react-pageflip with Framer Motion Flipbook

> Addendum to `yearbook_flipbook_styling_prompt.md`.
> Rip out `react-pageflip` entirely and implement the flipbook using Framer Motion.

---

## Setup

```bash
npm uninstall react-pageflip
npm install framer-motion
```

Load the `Caveat` font from Google Fonts in `layout.tsx` if not already present.

---

## Core Concept

The flip is a **3D Y-axis rotation** on a card. Each page has a **front face** and a **back face** baked into the same `motion.div`. When the user navigates forward, the current page rotates from `0°` to `-180°` (revealing its back), and the next page rotates from `180°` to `0°` (coming into view). Both animate simultaneously.

Use CSS `preserve-3d` and `backface-visibility: hidden` to make the two faces work correctly.

---

## Component: `<FlipbookViewer>`

```tsx
// components/FlipbookViewer.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FLIP_DURATION = 0.55; // seconds
const FLIP_EASE = [0.645, 0.045, 0.355, 1.0]; // cubic-bezier, feels physical

export function FlipbookViewer({ pages }: { pages: React.ReactNode[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const goNext = () => {
    if (current < pages.length - 1) {
      setDirection("next");
      setCurrent((c) => c + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection("prev");
      setCurrent((c) => c - 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Book stage */}
      <div
        className="relative"
        style={{ width: 550, height: 733, perspective: 1800 }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ rotateY: direction === "next" ? 90 : -90, opacity: 0.6 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: direction === "next" ? -90 : 90, opacity: 0.6 }}
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
            style={{ transformOrigin: direction === "next" ? "left center" : "right center" }}
            className="absolute inset-0 w-full h-full"
          >
            {pages[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <NavButton onClick={goPrev} disabled={current === 0} label="‹" />
        <span className="text-sm text-neutral-400 tabular-nums">
          {current + 1} / {pages.length}
        </span>
        <NavButton onClick={goNext} disabled={current === pages.length - 1} label="›" />
      </div>
    </div>
  );
}

function NavButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className="w-10 h-10 rounded-full flex items-center justify-center text-xl
                 bg-white border border-neutral-200 shadow-sm
                 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {label}
    </motion.button>
  );
}
```

---

## Keyboard Navigation

Add this in the parent page component (e.g. `/dashboard`):

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [current]);
```

---

## Page Wrapper

Every page passed into `<FlipbookViewer>` should use this wrapper so sizing and shadow are consistent:

```tsx
function BookPage({ children, style_config }) {
  return (
    <div
      className="w-full h-full rounded-sm overflow-hidden"
      style={{
        backgroundColor: style_config.background_color,
        fontFamily: fontMap[style_config.font],
        color: style_config.ink_color,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 2px 0 8px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}
```

The `boxShadow` gives it a subtle book-page depth without needing a heavy library.

---

## Responsive Sizing

Wrap the viewer in a container that scales it down on smaller screens:

```tsx
// Scale the 550x733 stage to fit the viewport
function ResponsiveBook({ children }) {
  const maxWidth = Math.min(550, window.innerWidth - 48);
  const scale = maxWidth / 550;
  return (
    <div style={{ width: maxWidth, height: 733 * scale, overflow: "hidden" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 550, height: 733 }}>
        {children}
      </div>
    </div>
  );
}
```

---

## Cover Page

The first page is always the cover — not an entry. Pass it as `pages[0]`:

```tsx
const coverPage = (
  <BookPage style_config={{ background_color: "#1a2e4a", font: "serif", ink_color: "#fffdf5", pattern: "none", border: "none" }}>
    <div className="flex flex-col items-center justify-center h-full gap-4 px-12 text-center">
      <p className="text-sm uppercase tracking-[0.3em] opacity-60">Class of 2025</p>
      <h1 className="text-4xl font-bold leading-tight">{ownerName}</h1>
      <p className="text-base opacity-70">{ownerUniversity}</p>
      <div className="mt-8 w-16 h-px bg-current opacity-30" />
      <p className="text-xs opacity-40 mt-2">Your Yearbook</p>
    </div>
  </BookPage>
);
```

Adjust the cover color to match whatever Unsplash image or design direction you land on.

---

## Notes

- `AnimatePresence mode="wait"` ensures the exit animation fully completes before the next page enters — this is what makes the flip feel like a real page turn rather than a crossfade
- `transformOrigin` switches between left and right depending on direction, so forward flips feel like turning a right-hand page and backward flips feel like turning back
- Do not use `layout` prop on the motion div — it conflicts with the 3D transform
- The `perspective: 1800` on the stage container controls how dramatic the 3D effect looks; increase for more subtle, decrease for more dramatic