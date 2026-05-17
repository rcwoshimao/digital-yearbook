import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** Default print width; page height follows the raster aspect ratio. */
export const PDF_REFERENCE_WIDTH_MM = 210;

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

export type PdfRaster = CapturedPng | LoadedImage;

export function getPdfPageDimensionsMm(
  rasterWidthPx: number,
  rasterHeightPx: number,
  referenceWidthMm = PDF_REFERENCE_WIDTH_MM,
) {
  const aspect = rasterWidthPx / rasterHeightPx;

  return {
    heightMm: referenceWidthMm / aspect,
    widthMm: referenceWidthMm,
  };
}

export function appendRasterToPdf(pdf: jsPDF | null, raster: PdfRaster): jsPDF {
  const { heightMm, widthMm } = getPdfPageDimensionsMm(raster.width, raster.height);
  const format: [number, number] = [widthMm, heightMm];

  const nextPdf = pdf ?? new jsPDF({ format, orientation: "portrait", unit: "mm" });

  if (pdf) {
    nextPdf.addPage(format, "portrait");
  }

  const pageWidth = nextPdf.internal.pageSize.getWidth();
  const pageHeight = nextPdf.internal.pageSize.getHeight();
  const imageFormat = "format" in raster && raster.format ? raster.format : "PNG";

  nextPdf.addImage(raster.dataUrl, imageFormat, 0, 0, pageWidth, pageHeight);

  return nextPdf;
}

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
  backgroundColor?: string,
): Promise<CapturedPng> {
  const canvas = await html2canvas(element, {
    backgroundColor: backgroundColor ?? null,
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
