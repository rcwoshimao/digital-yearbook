"use client";

import type { EditorTool } from "@/lib/canvas/free-drawing";

type HandwritingToolbarProps = {
  editorTool: EditorTool;
  onEditorToolChange: (tool: EditorTool) => void;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
  penColor: string;
  penWidth: number;
};

export function HandwritingToolbar({
  editorTool,
  onEditorToolChange,
  onPenColorChange,
  onPenWidthChange,
  penColor,
  penWidth,
}: HandwritingToolbarProps) {
  return (
    <div
      className="mb-4 w-full max-w-[550px] rounded-2xl border-2 border-yearbook-accent/40 bg-amber-50/80 p-4 ring-1 ring-amber-200"
      data-handwriting-toolbar="v1"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-yearbook-accent">Handwriting</p>
      <p className="mt-1 text-sm text-stone-700">
        Choose Pen, then draw on the dotted page. Use Select to move text or images.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-stone-300 bg-white p-1">
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              editorTool === "pen"
                ? "bg-yearbook-ink text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => onEditorToolChange("pen")}
            type="button"
          >
            Pen
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              editorTool === "select"
                ? "bg-yearbook-ink text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => onEditorToolChange("select")}
            type="button"
          >
            Select
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              editorTool === "eraser"
                ? "bg-yearbook-ink text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => onEditorToolChange("eraser")}
            type="button"
          >
            Eraser
          </button>
        </div>
        {editorTool === "pen" ? (
          <>
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
      </div>
    </div>
  );
}
