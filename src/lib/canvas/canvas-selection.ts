import { ActiveSelection, FabricImage, IText, Path, Textbox, type Canvas, type FabricObject } from "fabric";

export type CanvasSelectionKind = "text" | "image" | "path" | "multi" | null;

export type CanvasSelectionState = {
  kind: CanvasSelectionKind;
  count: number;
  selectedText: Textbox | IText | null;
};

type EditableText = Textbox | IText;

export function isEditableText(object: FabricObject | null | undefined): object is EditableText {
  return object instanceof Textbox || object instanceof IText;
}

export function isCanvasImage(object: FabricObject | null | undefined): object is FabricImage {
  return object instanceof FabricImage;
}

export function isInkPath(object: FabricObject | null | undefined): object is Path {
  if (!object) {
    return false;
  }

  return object instanceof Path || object.type === "path";
}

export function isDeletableCanvasObject(
  object: FabricObject,
): object is EditableText | FabricImage | Path {
  return isEditableText(object) || isCanvasImage(object) || isInkPath(object);
}

function isActiveSelection(
  object: FabricObject | null | undefined,
): object is ActiveSelection {
  return object instanceof ActiveSelection || object?.type === "activeselection";
}

export function getDeletableObjectsFromActive(active: FabricObject | null | undefined): FabricObject[] {
  if (!active) {
    return [];
  }

  if (isActiveSelection(active)) {
    return active.getObjects().filter(isDeletableCanvasObject);
  }

  return isDeletableCanvasObject(active) ? [active] : [];
}

export function resolveCanvasSelection(active: FabricObject | null | undefined): CanvasSelectionState {
  const objects = getDeletableObjectsFromActive(active);

  if (objects.length === 0) {
    return { kind: null, count: 0, selectedText: null };
  }

  if (objects.length > 1) {
    return {
      kind: "multi",
      count: objects.length,
      selectedText: null,
    };
  }

  const object = objects[0];

  if (isEditableText(object)) {
    return { kind: "text", count: 1, selectedText: object };
  }

  if (isCanvasImage(object)) {
    return { kind: "image", count: 1, selectedText: null };
  }

  if (isInkPath(object)) {
    return { kind: "path", count: 1, selectedText: null };
  }

  return { kind: null, count: 0, selectedText: null };
}

export function removeActiveSelection(canvas: Canvas, active: FabricObject | null | undefined) {
  const objects = getDeletableObjectsFromActive(active);

  for (const object of objects) {
    if (isEditableText(object) && object.isEditing) {
      continue;
    }

    canvas.remove(object);
  }

  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
