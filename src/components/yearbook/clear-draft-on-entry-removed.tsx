"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clearDraft } from "@/lib/canvas/draft-store";

type ClearDraftOnEntryRemovedProps = {
  yearbookId: string;
};

/** Clears the browser draft after the author removes their signature and returns to the editor. */
export function ClearDraftOnEntryRemoved({ yearbookId }: ClearDraftOnEntryRemovedProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("entry_removed") === "1") {
      void clearDraft(yearbookId);
    }
  }, [searchParams, yearbookId]);

  return null;
}
