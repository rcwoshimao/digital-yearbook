import type { Canvas } from "fabric";
import { FabricImage } from "fabric";

type PageDimensions = {
  width: number;
  height: number;
};

/** Stretch a background image to cover the full canvas (matches editor page size). */
export function fitBackgroundImageToPage(image: FabricImage, page: PageDimensions) {
  const { width: naturalWidth, height: naturalHeight } = image.getOriginalSize();
  const safeWidth = naturalWidth > 0 ? naturalWidth : page.width;
  const safeHeight = naturalHeight > 0 ? naturalHeight : page.height;

  image.set({
    scaleX: page.width / safeWidth,
    scaleY: page.height / safeHeight,
    left: 0,
    top: 0,
    originX: "left",
    originY: "top",
    objectCaching: false,
  });
}

export function applyBackgroundImageToCanvas(
  canvas: Canvas,
  image: FabricImage,
  page: PageDimensions,
) {
  fitBackgroundImageToPage(image, page);
  canvas.set({
    backgroundImage: image,
    backgroundVpt: false,
  });
}

/** Re-apply background settings after loadFromJSON (export + display depend on these). */
export function normalizeCanvasBackground(canvas: Canvas, page: PageDimensions) {
  const background = canvas.backgroundImage;
  if (background instanceof FabricImage) {
    fitBackgroundImageToPage(background, page);
    background.set({ objectCaching: false });
    background.dirty = true;
  }

  canvas.set({ backgroundVpt: false });
}
