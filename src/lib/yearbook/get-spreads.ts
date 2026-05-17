import type { YearbookEntry } from "@/lib/types/yearbook";

/** Left slot: an entry or the empty-yearbook placeholder. */
export type ContentSpreadLeft = YearbookEntry | "empty";

export type BookSpreadModel =
  | { kind: "cover" }
  | { kind: "back" }
  | { kind: "content"; left: ContentSpreadLeft; right: YearbookEntry | null };

/**
 * Builds spread indices for the flipbook viewer.
 * - spreads[0] = cover (single, centered in double-width stage)
 * - spreads[1..n-1] = entry pairs (right padded with null when odd)
 * - spreads[n] = back cover (single, centered)
 */
export function getSpreads(entries: YearbookEntry[]): BookSpreadModel[] {
  const spreads: BookSpreadModel[] = [{ kind: "cover" }];

  if (entries.length === 0) {
    spreads.push({ kind: "content", left: "empty", right: null });
  } else {
    for (let index = 0; index < entries.length; index += 2) {
      spreads.push({
        kind: "content",
        left: entries[index],
        right: entries[index + 1] ?? null,
      });
    }
  }

  spreads.push({ kind: "back" });

  return spreads;
}
