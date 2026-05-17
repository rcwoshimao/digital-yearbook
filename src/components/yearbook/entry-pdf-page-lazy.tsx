"use client";

import dynamic from "next/dynamic";

export const EntryPdfPage = dynamic(
  () => import("@/components/yearbook/entry-pdf-page").then((mod) => mod.EntryPdfPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-sm opacity-50">Loading…</p>
      </div>
    ),
  },
);
