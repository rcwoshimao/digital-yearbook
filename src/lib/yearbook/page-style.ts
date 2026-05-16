export type YearbookPagePattern = "none" | "lined" | "dotted" | "grid";
export type YearbookPageFont = "serif" | "handwritten" | "mono";
export type YearbookPageBorder = "none" | "classic" | "double" | "corner";

export type YearbookPageStyle = {
  background_color: string;
  pattern: YearbookPagePattern;
  font: YearbookPageFont;
  ink_color: string;
  border: YearbookPageBorder;
};

export const defaultYearbookPageStyle: YearbookPageStyle = {
  background_color: "#fffdf5",
  pattern: "none",
  font: "serif",
  ink_color: "#1a1a1a",
  border: "none",
};

export const backgroundOptions = [
  { label: "Cream", value: "#fffdf5" },
  { label: "Blush", value: "#fdecea" },
  { label: "Mint", value: "#e8f5f0" },
  { label: "Sky", value: "#e8f0fd" },
  { label: "Lavender", value: "#f0e8fd" },
  { label: "Sunflower", value: "#fdf8e1" },
  { label: "Rose", value: "#fde8f0" },
  { label: "Slate", value: "#e8edf5" },
] as const;

export const patternOptions = [
  { label: "None", value: "none" },
  { label: "Lined", value: "lined" },
  { label: "Dotted", value: "dotted" },
  { label: "Grid", value: "grid" },
] as const;

export const fontOptions = [
  { label: "Classic", value: "serif" },
  { label: "Handwritten", value: "handwritten" },
  { label: "Typewriter", value: "mono" },
] as const;

export const inkOptions = [
  { label: "Ink Black", value: "#1a1a1a" },
  { label: "Navy", value: "#1a2e4a" },
  { label: "Forest", value: "#1a3a2a" },
  { label: "Burgundy", value: "#4a1a1a" },
] as const;

export const borderOptions = [
  { label: "None", value: "none" },
  { label: "Classic", value: "classic" },
  { label: "Double", value: "double" },
  { label: "Corner", value: "corner" },
] as const;

export const fontFamilyByStyle: Record<YearbookPageFont, string> = {
  serif: "Georgia, serif",
  handwritten: "var(--font-caveat), cursive",
  mono: "'Courier New', monospace",
};

export function normalizeYearbookPageStyle(value: unknown): YearbookPageStyle {
  if (!value || typeof value !== "object") {
    return defaultYearbookPageStyle;
  }

  const candidate = value as Partial<YearbookPageStyle>;

  return {
    background_color: pickOption(
      backgroundOptions,
      candidate.background_color,
      defaultYearbookPageStyle.background_color,
    ),
    pattern: pickOption(patternOptions, candidate.pattern, defaultYearbookPageStyle.pattern),
    font: pickOption(fontOptions, candidate.font, defaultYearbookPageStyle.font),
    ink_color: pickOption(inkOptions, candidate.ink_color, defaultYearbookPageStyle.ink_color),
    border: pickOption(borderOptions, candidate.border, defaultYearbookPageStyle.border),
  };
}

function pickOption<T extends string>(
  options: readonly { value: T }[],
  candidate: unknown,
  fallback: T,
) {
  return options.some((option) => option.value === candidate) ? (candidate as T) : fallback;
}
