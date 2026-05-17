import html2canvas from "html2canvas";
import type { jsPDF } from "jspdf";

export const PDF_PAGE_MARGIN_MM = 10;

export type CapturedPng = {
  dataUrl: string;
  height: number;
  width: number;
};

export type LoadedImage = {
  dataUrl: string;
  format: "JPEG" | "PNG";
  height: number;
  width: number;
};

export async function fetchImageForPdf(url: string): Promise<LoadedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load signed page image.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise<LoadedImage>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas is not supported."));
          return;
        }

        context.drawImage(image, 0, 0);

        const isJpeg = blob.type.includes("jpeg") || blob.type.includes("jpg");
        const format = isJpeg ? "JPEG" : "PNG";

        resolve({
          dataUrl: canvas.toDataURL(isJpeg ? "image/jpeg" : "image/png", 0.92),
          format,
          height: image.naturalHeight,
          width: image.naturalWidth,
        });
      };

      image.onerror = () => reject(new Error("Failed to decode signed page image."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function captureElementToPng(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<CapturedPng> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    height,
    logging: false,
    scale: 2,
    useCORS: true,
    width,
    windowHeight: height,
    windowWidth: width,
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    height: canvas.height,
    width: canvas.width,
  };
}

export function addRasterToPdfPage(
  pdf: jsPDF,
  raster: { dataUrl: string; format?: "JPEG" | "PNG"; height: number; width: number },
  marginMm = PDF_PAGE_MARGIN_MM,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginMm * 2;
  const maxHeight = pageHeight - marginMm * 2;
  const aspect = raster.width / raster.height;

  let widthMm = maxWidth;
  let heightMm = widthMm / aspect;

  if (heightMm > maxHeight) {
    heightMm = maxHeight;
    widthMm = heightMm * aspect;
  }

  const x = (pageWidth - widthMm) / 2;
  const y = (pageHeight - heightMm) / 2;
  const format = raster.format ?? "PNG";

  pdf.addImage(raster.dataUrl, format, x, y, widthMm, heightMm);
}
