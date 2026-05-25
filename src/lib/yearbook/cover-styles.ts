import { YEARBOOK_THEME_FALLBACKS } from "@/lib/yearbook/theme";

export type YearbookCoverPattern = "none" | "damask";

export type YearbookCoverStyle = {
  background_color: string;
  pattern: YearbookCoverPattern;
};

export const COVER_DAMASK_ASSET = "/cover.png";

export const defaultCoverStyle: YearbookCoverStyle = {
  background_color: "#e8e0d4",
  pattern: "damask",
};

export const coverColorPresets = [
  { label: "Vintage Cream", value: "#e8e0d4" },
  { label: "Blush", value: "#f0ddd6" },
  { label: "Sage", value: "#d8e4d4" },
  { label: "Sky", value: "#d4dfe8" },
  { label: "Lavender", value: "#e0d8f0" },
  { label: "Gold", value: "#ebe0c8" },
  { label: "Navy", value: "#1a2e4a" },
  { label: "Burgundy", value: "#4a1a2a" },
] as const;

const coverPatternOptions = [
  { label: "None", value: "none" },
  { label: "Damask", value: "damask" },
] as const;

export function normalizeCoverStyle(value: unknown): YearbookCoverStyle {
  if (!value || typeof value !== "object") {
    return defaultCoverStyle;
  }

  const candidate = value as Partial<YearbookCoverStyle>;

  return {
    background_color: normalizeHexColor(
      candidate.background_color,
      defaultCoverStyle.background_color,
    ),
    pattern: pickCoverOption(
      coverPatternOptions,
      candidate.pattern,
      defaultCoverStyle.pattern,
    ),
  };
}

export function isLightCoverBackground(hex: string) {
  return relativeLuminance(hex) > 0.52;
}

export function coverInkColor(backgroundColor: string): string {
  return isLightCoverBackground(backgroundColor) ? "#1a1a1a" : YEARBOOK_THEME_FALLBACKS.page;
}

/** Slightly darker or lighter than the cover, for the damask overlay. */
export function coverPatternTint(backgroundColor: string): string {
  const luminance = relativeLuminance(backgroundColor);
  return luminance > 0.52
    ? shiftHexLightness(backgroundColor, -0.1)
    : shiftHexLightness(backgroundColor, 0.14);
}

export function coverStyleToPageStyle(style: YearbookCoverStyle) {
  return {
    background_color: style.background_color,
    pattern: "none" as const,
    font: "serif" as const,
    ink_color: coverInkColor(style.background_color),
    border: "none" as const,
  };
}

function pickCoverOption<T extends string>(
  options: readonly { value: T }[],
  candidate: unknown,
  fallback: T,
) {
  return options.some((option) => option.value === candidate) ? (candidate as T) : fallback;
}

function normalizeHexColor(candidate: unknown, fallback: string) {
  if (typeof candidate !== "string") {
    return fallback;
  }

  const normalized = candidate.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : fallback;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function shiftHexLightness(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = amount < 0 ? 0 : 255;
  const weight = Math.abs(amount);

  return rgbToHex(
    r + (mix - r) * weight,
    g + (mix - g) * weight,
    b + (mix - b) * weight,
  );
}
