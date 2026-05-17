export const YEARBOOK_CSS_VARS = {
  paper: "--yearbook-paper",
  paperDeep: "--yearbook-paper-deep",
  ink: "--yearbook-ink",
  accent: "--yearbook-accent",
  page: "--yearbook-page",
} as const;

/** Fallbacks must match :root in src/app/globals.css */
export const YEARBOOK_THEME_FALLBACKS = {
  paper: "#c7c0b5",
  paperDeep: "#b8b0a4",
  ink: "#27211b",
  accent: "#8f5f35",
  page: "#fffdf5",
} as const;

export function readYearbookCssVar(
  variable: (typeof YEARBOOK_CSS_VARS)[keyof typeof YEARBOOK_CSS_VARS],
  fallback: string,
): string {
  if (typeof document === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}
