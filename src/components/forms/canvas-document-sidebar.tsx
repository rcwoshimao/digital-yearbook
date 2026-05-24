"use client";

import {
  IconBackground,
  IconBackgroundImage,
  IconRedo,
  IconReset,
  IconSave,
  IconUndo,
} from "@/components/forms/canvas-editor-icons";

type CanvasDocumentSidebarProps = {
  backgroundColor: string;
  canRedo: boolean;
  canUndo: boolean;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImage: () => void;
  onClearBackgroundImage: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSaveDraft: () => void;
  onUndo: () => void;
};

function sidebarButtonClass(variant: "default" | "danger" = "default") {
  if (variant === "danger") {
    return "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-700 transition hover:bg-red-50";
  }

  return "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40";
}

export function CanvasDocumentSidebar({
  backgroundColor,
  canRedo,
  canUndo,
  onBackgroundColorChange,
  onBackgroundImage,
  onClearBackgroundImage,
  onRedo,
  onReset,
  onSaveDraft,
  onUndo,
}: CanvasDocumentSidebarProps) {
  return (
    <aside
      aria-label="Page and document"
      className="canvas-editor-sidebar flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-stone-200 bg-white/90 p-3 shadow-sm lg:w-44"
    >
      <div>
        <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">Page</p>
        <div className="mt-2 space-y-1">
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100">
            <IconBackground className="text-base" />
            <span className="flex-1">Background Color</span>
            <input
              aria-label="Background color"
              className="h-7 w-9 cursor-pointer rounded border border-stone-300"
              onChange={(event) => onBackgroundColorChange(event.target.value)}
              type="color"
              value={backgroundColor}
            />
          </label>
          <button className={sidebarButtonClass()} onClick={onBackgroundImage} type="button">
            <IconBackgroundImage className="text-base" />
            Background image
          </button>
          <button className={sidebarButtonClass()} onClick={onClearBackgroundImage} type="button">
            <span className="ml-6 text-stone-500">Clear Background Image</span>
          </button>
        </div>
      </div>

      <div>
        <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">History</p>
        <div className="mt-2 space-y-1">
          <button
            className={sidebarButtonClass()}
            disabled={!canUndo}
            onClick={onUndo}
            type="button"
          >
            <IconUndo className="text-base" />
            Undo
          </button>
          <button
            className={sidebarButtonClass()}
            disabled={!canRedo}
            onClick={onRedo}
            type="button"
          >
            <IconRedo className="text-base" />
            Redo
          </button>
        </div>
      </div>

      <div className="mt-auto space-y-1 border-t border-stone-200 pt-3">
        <button className={sidebarButtonClass()} onClick={onSaveDraft} type="button">
          <IconSave className="text-base" />
          Save draft
        </button>
        <button className={sidebarButtonClass("danger")} onClick={onReset} type="button">
          <IconReset className="text-base" />
          Reset board
        </button>
      </div>
    </aside>
  );
}
