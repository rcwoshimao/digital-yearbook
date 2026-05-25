import type { Canvas } from "fabric";
import { FabricImage } from "fabric";

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

/**
 * Fabric's toDataURL(multiplier) scales the canvas but leaves backgroundImage at
 * logical page size when backgroundVpt is false — a tiny strip in the top-left.
 * Export objects without the background, then stretch-draw the bg to full export size.
 */
export function exportPageImage(canvas: Canvas, profile: PageExportProfile): Blob {
  const multiplier = profile.multiplier;
  const exportWidth = canvas.width * multiplier;
  const exportHeight = canvas.height * multiplier;

  const savedBackgroundImage = canvas.backgroundImage;
  const savedBackgroundColor = canvas.backgroundColor;

  canvas.set({
    backgroundImage: undefined,
    backgroundColor: "",
  });

  const objectsLayer = canvas.toCanvasElement(multiplier);

  canvas.set({
    backgroundImage: savedBackgroundImage,
    backgroundColor: savedBackgroundColor,
  });

  const output = document.createElement("canvas");
  output.width = exportWidth;
  output.height = exportHeight;

  const ctx = output.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create export canvas.");
  }

  if (typeof savedBackgroundColor === "string") {
    ctx.fillStyle = savedBackgroundColor;
    ctx.fillRect(0, 0, exportWidth, exportHeight);
  }

  if (savedBackgroundImage instanceof FabricImage) {
    const element = savedBackgroundImage.getElement() as CanvasImageSource | null;
    if (element) {
      ctx.drawImage(element, 0, 0, exportWidth, exportHeight);
    }
  }

  ctx.drawImage(objectsLayer, 0, 0);

  return dataUrlToBlob(output.toDataURL("image/jpeg", profile.quality));
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
