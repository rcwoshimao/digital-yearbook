"use client";

import { jsPDF } from "jspdf";
import { useRef, useState } from "react";
import { BookPage } from "@/components/yearbook/book-page";
import { EntryPageContent } from "@/components/yearbook/entry-page-content";
import { BOOK_HEIGHT, BOOK_WIDTH } from "@/components/yearbook/flipbook-viewer";
import { BackCoverPage, CoverPage } from "@/components/yearbook/yearbook-cover-page";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { coverStyleConfig } from "@/lib/yearbook/cover-styles";
import { normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";
import {
  appendRasterToPdf,
  captureElementToPng,
  fetchImageForPdf,
} from "@/lib/yearbook/pdf-export";

type PdfExportButtonProps = {
  entries: YearbookEntry[];
  ownerClass?: string | null;
  ownerName: string;
  ownerUniversity?: string | null;
};

const exportPageStyle = { height: BOOK_HEIGHT, width: BOOK_WIDTH } as const;

export function PdfExportButton({
  entries,
  ownerClass,
  ownerName,
  ownerUniversity,
}: PdfExportButtonProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const classLabel = ownerClass ? `Class of ${ownerClass}` : "Class Memories";
  const domExportEntries = entries.filter((entry) => !entry.pageImageUrl);

  async function exportPdf() {
    const root = exportRef.current;
    if (!root) {
      return;
    }

    setIsExporting(true);

    try {
      const pdf = await buildYearbookPdf(root, entries);
      if (!pdf) {
        return;
      }

      pdf.save(`yearbook-${slugify(ownerName)}-${new Date().getFullYear()}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        className="rounded-full border border-yearbook-accent px-4 py-2 text-sm font-semibold text-yearbook-accent disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isExporting}
        onClick={() => void exportPdf()}
        type="button"
      >
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10000px] top-0"
        ref={exportRef}
      >
        <div className="h-full w-full overflow-hidden" data-pdf-page="cover" style={exportPageStyle}>
          <CoverPage
            classLabel={classLabel}
            flat
            ownerName={ownerName}
            ownerUniversity={ownerUniversity}
          />
        </div>
        {domExportEntries.map((entry) => (
          <div
            className="h-full w-full overflow-hidden"
            data-pdf-page={`entry-${entry.id}`}
            key={entry.id}
            style={exportPageStyle}
          >
            <BookPage flat styleConfig={normalizeYearbookPageStyle(entry.styleConfig)}>
              <EntryPageContent entry={entry} />
            </BookPage>
          </div>
        ))}
        <div className="h-full w-full overflow-hidden" data-pdf-page="back" style={exportPageStyle}>
          <BackCoverPage flat ownerName={ownerName} />
        </div>
      </div>
    </>
  );
}

async function buildYearbookPdf(
  root: HTMLDivElement,
  entries: YearbookEntry[],
): Promise<jsPDF | null> {
  let pdf: jsPDF | null = null;

  const appendDomPage = async (selector: string, backgroundColor?: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) {
      return;
    }

    const captured = await captureElementToPng(
      element,
      BOOK_WIDTH,
      BOOK_HEIGHT,
      backgroundColor,
    );
    pdf = appendRasterToPdf(pdf, captured);
  };

  const appendImagePage = async (url: string) => {
    const loaded = await fetchImageForPdf(url);
    pdf = appendRasterToPdf(pdf, loaded);
  };

  await appendDomPage('[data-pdf-page="cover"]', coverStyleConfig.background_color);

  for (const entry of entries) {
    if (entry.pageImageUrl) {
      await appendImagePage(entry.pageImageUrl);
      continue;
    }

    await appendDomPage(`[data-pdf-page="entry-${entry.id}"]`);
  }

  await appendDomPage('[data-pdf-page="back"]', coverStyleConfig.background_color);

  return pdf;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
