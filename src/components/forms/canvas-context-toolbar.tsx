"use client";

import { IconTrash } from "@/components/forms/canvas-editor-icons";
import { CANVAS_FONT_OPTIONS } from "@/lib/yearbook/canvas-fonts";
import type { CanvasSelectionKind } from "@/lib/canvas/canvas-selection";
import type { EditorTool } from "@/lib/canvas/free-drawing";

const TOOLBAR_SLOT_HEIGHT = "4.5rem";

type CanvasContextToolbarProps = {
  editorTool: EditorTool;
  fontFamily: string;
  fontSize: number;
  onDelete: () => void;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
  onTextColorChange: (value: string) => void;
  penColor: string;
  penWidth: number;
  selectionCount: number;
  selectionKind: CanvasSelectionKind;
  textColor: string;
};

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-700 transition hover:bg-red-50"
      onClick={onClick}
      title={label}
      type="button"
    >
      <IconTrash className="text-base" />
    </button>
  );
}

export function CanvasContextToolbar({
  editorTool,
  fontFamily,
  fontSize,
  onDelete,
  onFontFamilyChange,
  onFontSizeChange,
  onPenColorChange,
  onPenWidthChange,
  onTextColorChange,
  penColor,
  penWidth,
  selectionCount,
  selectionKind,
  textColor,
}: CanvasContextToolbarProps) {
  const showSelection = selectionKind !== null;
  const showPen = !showSelection && editorTool === "pen";
  const showEraser = !showSelection && editorTool === "eraser";
  const isVisible = showSelection || showPen || showEraser;

  return (
    <div
      className="canvas-context-toolbar-slot w-full max-w-[550px] shrink-0"
      style={{ height: TOOLBAR_SLOT_HEIGHT }}
    >
      <div
        aria-hidden={!isVisible}
        className={`flex h-full flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-yearbook-paper px-3 py-2 transition-opacity ${
          isVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {showPen ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Pen</p>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
              Ink
              <input
                className="h-8 w-10 cursor-pointer rounded border border-stone-300"
                onChange={(event) => onPenColorChange(event.target.value)}
                type="color"
                value={penColor}
              />
            </label>
            <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-700">
              Size
              <input
                className="w-28 accent-yearbook-ink"
                max={24}
                min={1}
                onChange={(event) => onPenWidthChange(Number(event.target.value))}
                type="range"
                value={penWidth}
              />
              <span className="tabular-nums text-stone-500">{penWidth}px</span>
            </label>
          </>
        ) : null}

        {showEraser ? (
          <p className="text-sm text-stone-600">Drag over handwriting to erase strokes.</p>
        ) : null}

        {showSelection && selectionKind === "multi" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {selectionCount} items selected
            </p>
            <DeleteButton label={`Delete ${selectionCount} items`} onClick={onDelete} />
          </>
        ) : null}

        {showSelection && selectionKind === "path" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Handwriting</p>
            <DeleteButton label="Delete handwriting" onClick={onDelete} />
          </>
        ) : null}

        {showSelection && selectionKind === "text" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Text</p>
            <label className="text-xs font-semibold text-stone-700">
              Font
              <select
                className="ml-2 max-w-[10rem] rounded-lg border border-stone-300 px-2 py-1 text-xs"
                onChange={(event) => onFontFamilyChange(event.target.value)}
                value={fontFamily}
              >
                {CANVAS_FONT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-stone-700">
              Size
              <input
                className="ml-2 w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs"
                max={96}
                min={10}
                onChange={(event) => onFontSizeChange(Number(event.target.value))}
                type="number"
                value={fontSize}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
              Color
              <input
                className="h-8 w-10 cursor-pointer rounded border border-stone-300"
                onChange={(event) => onTextColorChange(event.target.value)}
                type="color"
                value={textColor}
              />
            </label>
            <DeleteButton label="Delete text" onClick={onDelete} />
          </>
        ) : null}

        {showSelection && selectionKind === "image" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Image</p>
            <DeleteButton label="Delete image" onClick={onDelete} />
          </>
        ) : null}
      </div>
    </div>
  );
}
