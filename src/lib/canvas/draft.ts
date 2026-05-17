const DRAFT_PREFIX = "draft:";

export function draftStorageKey(yearbookId: string) {
  return `${DRAFT_PREFIX}${yearbookId}`;
}

export function readDraft(yearbookId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(draftStorageKey(yearbookId));
  } catch {
    return null;
  }
}

export function writeDraft(yearbookId: string, payload: string) {
  window.localStorage.setItem(draftStorageKey(yearbookId), payload);
}

export function clearDraft(yearbookId: string) {
  window.localStorage.removeItem(draftStorageKey(yearbookId));
}
