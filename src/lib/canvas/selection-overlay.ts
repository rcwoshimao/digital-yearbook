import { Canvas, IText, InteractiveFabricObject } from "fabric";

/** Stroke color for selection chrome; works with `difference` blend on any background. */
const SELECTION_STROKE = "#ffffff";
const SELECTION_BORDER_SCALE = 1.5;
const SELECTION_MARQUEE_LINE_WIDTH = 2.5;

let selectionOverlayConfigured = false;

/**
 * Selection borders/controls use `difference` blend so they stay visible on photos
 * and colored backgrounds. Call once before creating any Fabric canvas.
 */
export function configureCanvasSelectionOverlay() {
  if (selectionOverlayConfigured) {
    return;
  }

  selectionOverlayConfigured = true;

  Object.assign(InteractiveFabricObject.ownDefaults, {
    borderColor: SELECTION_STROKE,
    cornerColor: SELECTION_STROKE,
    cornerStrokeColor: SELECTION_STROKE,
    transparentCorners: false,
    borderScaleFactor: SELECTION_BORDER_SCALE,
    borderOpacityWhenMoving: 1,
  });

  Object.assign(IText.ownDefaults, {
    editingBorderColor: SELECTION_STROKE,
  });

  const originalRenderControls = InteractiveFabricObject.prototype._renderControls;
  InteractiveFabricObject.prototype._renderControls = function (ctx, styleOverride) {
    ctx.save();
    ctx.globalCompositeOperation = "difference";
    originalRenderControls.call(this, ctx, styleOverride);
    ctx.restore();
  };

  const canvasProto = Canvas.prototype as Canvas & {
    _drawSelection: (ctx: CanvasRenderingContext2D) => void;
  };
  const originalDrawSelection = canvasProto._drawSelection;
  canvasProto._drawSelection = function (ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "difference";
    originalDrawSelection.call(this, ctx);
    ctx.restore();
  };
}

export function getCanvasSelectionOptions() {
  return {
    selectionColor: "",
    selectionBorderColor: SELECTION_STROKE,
    selectionLineWidth: SELECTION_MARQUEE_LINE_WIDTH,
  } as const;
}
