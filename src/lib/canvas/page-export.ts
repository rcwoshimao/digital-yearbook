import type { Canvas } from "fabric";
import { normalizeCanvasBackground } from "@/lib/canvas/background-image";

export type PageExportProfile = {
  multiplier: number;
  quality: number;
};

/** Sharp preview in the signing dialog (~2750×3665 at book aspect). */
export const PAGE_PREVIEW_EXPORT: PageExportProfile = {
  multiplier: 5,
  quality: 0.92,
};

/** Stored yearbook page (~1100×1466); enough for flipbook at book size. */
export const PAGE_SUBMIT_EXPORT: PageExportProfile = {
  multiplier: 2,
  quality: 0.82,
};

/** Keep in sync with MAX_PAGE_IMAGE_SIZE in write/actions.ts */
export const MAX_SUBMIT_PAGE_IMAGE_BYTES = 10 * 1024 * 1024;

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

export function exportPageImage(canvas: Canvas, profile: PageExportProfile): Blob {
  normalizeCanvasBackground(canvas, { width: canvas.width, height: canvas.height });
  canvas.requestRenderAll();

  const dataUrl = canvas.toDataURL({
    format: "jpeg",
    quality: profile.quality,
    multiplier: profile.multiplier,
  });

  return dataUrlToBlob(dataUrl);
}

/** Low-res JPEG for storage; lowers quality if the file exceeds the upload cap. */
export function exportPageImageForSubmit(canvas: Canvas): Blob {
  let quality = PAGE_SUBMIT_EXPORT.quality;
  let blob = exportPageImage(canvas, { ...PAGE_SUBMIT_EXPORT, quality });

  while (blob.size > MAX_SUBMIT_PAGE_IMAGE_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = exportPageImage(canvas, { ...PAGE_SUBMIT_EXPORT, quality });
  }

  return blob;
}
