"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useRef, useState } from "react";
import { EntryCard } from "@/components/yearbook/entry-card";
import type { YearbookEntry } from "@/lib/types/yearbook";

type PdfExportButtonProps = {
  entries: YearbookEntry[];
  ownerName: string;
};

export function PdfExportButton({ entries, ownerName }: PdfExportButtonProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function exportPdf() {
    if (!exportRef.current || entries.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const pages = Array.from(exportRef.current.querySelectorAll<HTMLElement>("[data-pdf-page]"));
      const pdf = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imageWidth = pageWidth - margin * 2;

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const canvas = await html2canvas(page, {
          backgroundColor: "#fff8ed",
          scale: 2,
          useCORS: true,
        });
        const imageData = canvas.toDataURL("image/png");
        const imageHeight = Math.min((canvas.height * imageWidth) / canvas.width, pageHeight - margin * 2);

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(imageData, "PNG", margin, margin, imageWidth, imageHeight);
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
        disabled={entries.length === 0 || isExporting}
        onClick={exportPdf}
        type="button"
      >
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10000px] top-0 w-[760px]"
        ref={exportRef}
      >
        {entries.map((entry) => (
          <div data-pdf-page key={entry.id} className="mb-6 bg-yearbook-paper p-6">
            <EntryCard entry={entry} />
          </div>
        ))}
      </div>
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
