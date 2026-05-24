"use client";

import type { ReactNode } from "react";
import type { EditorTool } from "@/lib/canvas/free-drawing";
import {
  IconEraser,
  IconImage,
  IconPen,
  IconSelect,
  IconSticker,
  IconText,
} from "@/components/forms/canvas-editor-icons";

type CanvasToolRailProps = {
  editorTool: EditorTool;
  onAddImage: () => void;
  onAddStickers: () => void;
  onAddText: () => void;
  onToolChange: (tool: EditorTool) => void;
};

type RailTool = EditorTool | "add-text" | "add-image" | "add-sticker";

function toolButtonClass(active: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-xl transition ${
    active
      ? "bg-yearbook-ink text-white shadow-sm"
      : "text-stone-600 hover:bg-stone-100 hover:text-yearbook-ink"
  }`;
}

export function CanvasToolRail({
  editorTool,
  onAddImage,
  onAddStickers,
  onAddText,
  onToolChange,
}: CanvasToolRailProps) {
  const tools: { id: RailTool; label: string; icon: ReactNode; action: () => void }[] = [
    { id: "select", label: "Select", icon: <IconSelect />, action: () => onToolChange("select") },
    { id: "eraser", label: "Eraser", icon: <IconEraser />, action: () => onToolChange("eraser") },
    { id: "pen", label: "Pen", icon: <IconPen />, action: () => onToolChange("pen") },
    { id: "add-text", label: "Add text", icon: <IconText />, action: onAddText },
    { id: "add-image", label: "Add image", icon: <IconImage />, action: onAddImage },
    { id: "add-sticker", label: "Stickers", icon: <IconSticker />, action: onAddStickers },
  ];

  return (
    <aside
      aria-label="Canvas tools"
      className="canvas-editor-rail flex shrink-0 flex-row gap-1 rounded-2xl border border-stone-200 bg-white/90 p-1.5 shadow-sm lg:flex-col"
    >
      {tools.map((tool) => {
        const isModeTool = tool.id === "select" || tool.id === "eraser" || tool.id === "pen";
        const active = isModeTool && editorTool === tool.id;

        return (
          <button
            key={tool.id}
            aria-label={tool.label}
            aria-pressed={isModeTool ? active : undefined}
            className={toolButtonClass(active)}
            onClick={tool.action}
            title={tool.label}
            type="button"
          >
            {tool.icon}
          </button>
        );
      })}
    </aside>
  );
}
