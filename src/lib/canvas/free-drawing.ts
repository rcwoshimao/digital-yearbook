import {
  Canvas,
  Path,
  PencilBrush,
  Point,
  type FabricObject,
  type TPointerEventInfo,
} from "fabric";

export type EditorTool = "select" | "pen" | "eraser";

export function isInkPath(object: FabricObject | null | undefined): object is Path {
  if (!object) {
    return false;
  }

  return object instanceof Path || object.type === "path";
}

export function applyEditorTool(
  canvas: Canvas,
  tool: EditorTool,
  penColor: string,
  penWidth: number,
) {
  canvas.discardActiveObject();

  if (tool === "pen") {
    if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }

    const brush = canvas.freeDrawingBrush;
    brush.color = penColor;
    brush.width = penWidth;
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor = "crosshair";
  } else if (tool === "eraser") {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = "cell";
    canvas.hoverCursor = "cell";
  } else {
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
  }

  canvas.requestRenderAll();
}

function eraseInkAt(canvas: Canvas, pointer: Point) {
  const objects = canvas.getObjects();

  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];
    if (!isInkPath(object)) {
      continue;
    }

    if (object.containsPoint(pointer)) {
      canvas.remove(object);
      return true;
    }
  }

  return false;
}

export function bindEraserHandlers(
  canvas: Canvas,
  getTool: () => EditorTool,
  onErased: () => void,
) {
  let isErasing = false;
  let erasedDuringStroke = false;

  const finishStroke = () => {
    if (erasedDuringStroke) {
      onErased();
    }

    isErasing = false;
    erasedDuringStroke = false;
  };

  const tryErase = (event: TPointerEventInfo) => {
    if (getTool() !== "eraser") {
      return;
    }

    const pointer = event.scenePoint;
    if (pointer === undefined) {
      return;
    }

    if (eraseInkAt(canvas, pointer)) {
      canvas.requestRenderAll();
      erasedDuringStroke = true;
    }
  };

  const onMouseDown = (event: TPointerEventInfo) => {
    if (getTool() !== "eraser") {
      return;
    }

    isErasing = true;
    tryErase(event);
  };

  const onMouseMove = (event: TPointerEventInfo) => {
    if (!isErasing || getTool() !== "eraser") {
      return;
    }

    tryErase(event);
  };

  canvas.on("mouse:down", onMouseDown);
  canvas.on("mouse:move", onMouseMove);
  canvas.on("mouse:up", finishStroke);
  canvas.on("mouse:out", finishStroke);

  return () => {
    canvas.off("mouse:down", onMouseDown);
    canvas.off("mouse:move", onMouseMove);
    canvas.off("mouse:up", finishStroke);
    canvas.off("mouse:out", finishStroke);
  };
}
