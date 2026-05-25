"use client";

import { motion } from "framer-motion";

const MARQUEE_IMAGES = [
  { src: "/assets/sample/sample1.png", alt: "Sample yearbook page 1" },
  { src: "/assets/sample/sample2.png", alt: "Sample yearbook page 2" },
  { src: "/assets/sample/sample3.png", alt: "Sample yearbook page 3" },
  { src: "/assets/sample/sample4.png", alt: "Sample yearbook page 4" },
] as const;

const ITEM_GAP = 12;
const PAGE_HEIGHT = 360;

type MarqueeImage = { src: string; alt: string };

type SampleMarqueeProps = {
  images?: readonly MarqueeImage[];
};

export function SampleMarquee({ images = MARQUEE_IMAGES }: SampleMarqueeProps) {
  const track = [...images, ...images];

  return (
    <div
      aria-label="Sample yearbook pages"
      className="overflow-hidden"
      role="region"
      style={{ height: PAGE_HEIGHT }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        className="flex h-full w-max items-center"
        style={{ gap: ITEM_GAP }}
        transition={{
          x: {
            duration: 32,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          },
        }}
      >
        {track.map((image, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${image.src}-${index}`}
            alt={image.alt}
            className="block w-auto shrink-0"
            draggable={false}
            src={image.src}
            style={{ height: PAGE_HEIGHT }}
          />
        ))}
      </motion.div>
    </div>
  );
}
