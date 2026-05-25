"use client";

import { useEffect, useState } from "react";
import { PdfExportButton } from "@/components/yearbook/pdf-export-button";
import { CoverStyleControls } from "@/components/yearbook/cover-style-controls";
import { YearbookFlipbook } from "@/components/yearbook/yearbook-flipbook";
import type { YearbookCoverStyle } from "@/lib/yearbook/cover-styles";
import type { YearbookEntry } from "@/lib/types/yearbook";

type YearbookDashboardSectionProps = {
  coverStyleMigrationNeeded?: boolean;
  entries: YearbookEntry[];
  initialCoverStyle: YearbookCoverStyle;
  ownerClass?: string | null;
  ownerName: string;
  ownerUniversity?: string | null;
  shareUrl: string;
  yearbookId: string;
};

export function YearbookDashboardSection({
  coverStyleMigrationNeeded = false,
  entries,
  initialCoverStyle,
  ownerClass,
  ownerName,
  ownerUniversity,
  shareUrl,
  yearbookId,
}: YearbookDashboardSectionProps) {
  const [coverStyle, setCoverStyle] = useState(initialCoverStyle);
  const entryLabel = entries.length === 1 ? "signed page" : "signed pages";

  useEffect(() => {
    setCoverStyle(initialCoverStyle);
  }, [initialCoverStyle]);

  return (
    <section className="space-y-4">
      <CoverStyleControls
        coverStyle={coverStyle}
        migrationNeeded={coverStyleMigrationNeeded}
        onCoverStyleChange={setCoverStyle}
        yearbookId={yearbookId}
      />
      <YearbookFlipbook
        coverStyle={coverStyle}
        entries={entries}
        ownerClass={ownerClass}
        ownerName={ownerName}
        ownerUniversity={ownerUniversity}
        shareUrl={shareUrl}
        toolbarEnd={
          <PdfExportButton
            coverStyle={coverStyle}
            entries={entries}
            ownerClass={ownerClass}
            ownerName={ownerName}
            ownerUniversity={ownerUniversity}
          />
        }
        toolbarStart={
          <p className="whitespace-nowrap text-sm font-bold text-yearbook-ink">
            {entries.length} {entryLabel}
          </p>
        }
      />
    </section>
  );
}
