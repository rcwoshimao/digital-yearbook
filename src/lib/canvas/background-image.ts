import type { Canvas } from "fabric";
import { FabricImage, type FabricObject } from "fabric";

/** Legacy: page-background was briefly a canvas object; strip on load/apply. */
const LEGACY_PAGE_BACKGROUND_KEY = "__pageBackground";

function hasLegacyPageBackgroundFlag(object: FabricObject) {
  return Boolean((object as unknown as Record<string, unknown>)[LEGACY_PAGE_BACKGROUND_KEY]);
}

function removeLegacyPageBackgroundObjects(canvas: Canvas) {
  for (const object of canvas.getObjects()) {
    if (hasLegacyPageBackgroundFlag(object)) {
      canvas.remove(object);
    }
  }
}

type PageDimensions = {
  width: number;
  height: number;
};

function getNaturalSize(image: FabricImage) {
  const { width, height } = image.getOriginalSize();
  if (width > 0 && height > 0) {
    return { width, height };
  }

  const fallbackWidth = image.width ?? 0;
  const fallbackHeight = image.height ?? 0;
  if (fallbackWidth > 0 && fallbackHeight > 0) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  return null;
}

/** Stretch background to fill the page (independent scaleX/scaleY, not crop). */
export function fitBackgroundImageToPage(image: FabricImage, page: PageDimensions): boolean {
  const natural = getNaturalSize(image);
  if (!natural) {
    return false;
  }

  image.set({
    width: natural.width,
    height: natural.height,
    scaleX: page.width / natural.width,
    scaleY: page.height / natural.height,
    cropX: 0,
    cropY: 0,
    angle: 0,
    left: 0,
    top: 0,
    originX: "left",
    originY: "top",
    objectCaching: false,
  });
  image.setCoords();
  return true;
}

function whenBackgroundReady(image: FabricImage, page: PageDimensions, onReady: () => void) {
  if (fitBackgroundImageToPage(image, page)) {
    onReady();
    return;
  }

  const element = image.getElement() as HTMLImageElement | null;
  if (!element) {
    return;
  }

  const run = () => {
    fitBackgroundImageToPage(image, page);
    onReady();
  };

  if (element.complete && element.naturalWidth > 0) {
    run();
    return;
  }

  element.addEventListener("load", run, { once: true });
}

export function applyBackgroundImageToCanvas(
  canvas: Canvas,
  image: FabricImage,
  page: PageDimensions,
) {
  removeLegacyPageBackgroundObjects(canvas);

  whenBackgroundReady(image, page, () => {
    canvas.set({
      backgroundImage: image,
      backgroundVpt: false,
    });
    canvas.requestRenderAll();
  });
}

/**
 * Re-fit after undo/redo or draft restore (JSON may carry stale width/scale).
 * Do not call this right before export — it can change a background that already looks correct.
 */
export function refitCanvasBackgroundAfterLoad(canvas: Canvas, page: PageDimensions) {
  removeLegacyPageBackgroundObjects(canvas);

  let background = canvas.backgroundImage;
  if (!(background instanceof FabricImage)) {
    const legacy = canvas
      .getObjects()
      .find((object) => object instanceof FabricImage && hasLegacyPageBackgroundFlag(object));
    if (legacy instanceof FabricImage) {
      canvas.remove(legacy);
      background = legacy;
      canvas.backgroundImage = legacy;
    }
  }

  if (!(background instanceof FabricImage)) {
    canvas.set({ backgroundVpt: false });
    return;
  }

  whenBackgroundReady(background, page, () => {
    background.set({ objectCaching: false });
    background.dirty = true;
    canvas.set({ backgroundVpt: false });
    canvas.requestRenderAll();
  });
}

