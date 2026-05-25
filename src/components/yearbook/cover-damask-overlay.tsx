import type { CSSProperties } from "react";
import { COVER_DAMASK_ASSET } from "@/lib/yearbook/cover-styles";

type CoverDamaskOverlayProps = {
  backgroundColor: string;
};

/** How much of the solid cover color washes over the pattern (higher = subtler pattern). */
const PATTERN_WASH_ALPHA = 0.96;

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
}

/**
 * Pattern tile with a translucent wash of the cover color on top — reads as a
 * subtle overlay and works inside the flipbook scale transform (unlike mask-image).
 */
export function CoverDamaskOverlay({ backgroundColor }: CoverDamaskOverlayProps) {
  const { r, g, b } = hexToRgb(backgroundColor);
  const wash = `rgba(${r}, ${g}, ${b}, ${PATTERN_WASH_ALPHA})`;

  const overlayStyle: CSSProperties = {
    backgroundImage: `linear-gradient(${wash}, ${wash}), url("${COVER_DAMASK_ASSET}")`,
    backgroundRepeat: "repeat",
    backgroundSize: "auto, 300px 300px",
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={overlayStyle}
    />
  );
}
