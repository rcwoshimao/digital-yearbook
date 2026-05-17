"use client";

import { useEffect, useRef, useState } from "react";

type EntryPdfPageProps = {
  title: string;
  url: string;
};

type ViewMode = "loading" | "image" | "iframe";

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  return pdfjs;
}

function chromelessPdfUrl(url: string) {
  const hash = "toolbar=0&navpanes=0&scrollbar=0&view=Fit";
  return url.includes("#") ? `${url}&${hash}` : `${url}#${hash}`;
}

export function EntryPdfPage({ title, url }: EntryPdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewModeRef = useRef<ViewMode>("loading");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("loading");

  viewModeRef.current = viewMode;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let activeRender: { cancel: () => void } | null = null;

    async function renderPage() {
      const el = containerRef.current;
      if (!el) {
        return;
      }

      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width < 1 || height < 1) {
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`PDF fetch failed (${response.status})`);
        }

        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: await response.arrayBuffer() }).promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(width / baseViewport.width, height / baseViewport.height);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas 2D context unavailable");
        }

        activeRender?.cancel();
        const task = page.render({ canvas, canvasContext: context, viewport });
        activeRender = task;
        await task.promise;

        if (cancelled) {
          return;
        }

        setImageSrc(canvas.toDataURL("image/jpeg", 0.92));
        setViewMode("image");
      } catch (renderError) {
        console.error("EntryPdfPage: pdf.js render failed, using iframe fallback", renderError);
        if (!cancelled) {
          setImageSrc(null);
          setViewMode("iframe");
        }
      }
    }

    setViewMode("loading");
    setImageSrc(null);
    void renderPage();

    const observer = new ResizeObserver(() => {
      if (!cancelled && viewModeRef.current !== "iframe") {
        void renderPage();
      }
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      activeRender?.cancel();
      observer.disconnect();
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-white"
    >
      {viewMode === "loading" ? <p className="text-sm opacity-50">Loading…</p> : null}
      {viewMode === "image" && imageSrc ? (
        <img
          alt={title}
          className="h-full w-full object-contain"
          draggable={false}
          src={imageSrc}
        />
      ) : null}
      {viewMode === "iframe" ? (
        <iframe
          className="h-full w-full border-0"
          src={chromelessPdfUrl(url)}
          title={title}
        />
      ) : null}
    </div>
  );
}
