"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, IText, Textbox, type FabricObject } from "fabric";
import { submitCanvasEntry } from "@/app/yearbook/[yearbookId]/write/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearDraft, hasDraft, loadDraftCanvas, saveDraft } from "@/lib/canvas/draft-store";
import {
  exportPageImage,
  exportPageImageForSubmit,
  PAGE_PREVIEW_EXPORT,
} from "@/lib/canvas/page-export";
import {
  configureCanvasSelectionOverlay,
  getCanvasSelectionOptions,
} from "@/lib/canvas/selection-overlay";
import { isNextNavigationError } from "@/lib/next/is-redirect-error";
import { BOOK_HEIGHT, BOOK_WIDTH } from "@/components/yearbook/flipbook-viewer";
import {
  CANVAS_FONT_OPTIONS,
  normalizeCanvasFontFamily,
  preloadCanvasFonts,
} from "@/lib/yearbook/canvas-fonts";
import { YEARBOOK_THEME_FALLBACKS } from "@/lib/yearbook/theme";
import { StickerPickerDialog } from "@/components/forms/sticker-picker-dialog";

configureCanvasSelectionOverlay();

/** Match yearbook page size so the editor WYSIWYG matches the signed page. */
const PAGE_WIDTH = BOOK_WIDTH;
const PAGE_HEIGHT = BOOK_HEIGHT;
const HISTORY_LIMIT = 30;
const MOBILE_MAX_WIDTH = 767;

const DEFAULT_TEXT_WIDTH = 320;

type EditableText = Textbox | IText;

type CanvasEntryEditorProps = {
  ownerUsername: string;
  submitError?: string | null;
  yearbookId: string;
};

export function CanvasEntryEditor({
  ownerUsername,
  submitError = null,
  yearbookId,
}: CanvasEntryEditorProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const hasPreviewedRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);
  const [selectionKind, setSelectionKind] = useState<"text" | "image" | null>(null);
  const [selectedText, setSelectedText] = useState<EditableText | null>(null);
  const [fontFamily, setFontFamily] = useState<string>(CANVAS_FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState<string>(YEARBOOK_THEME_FALLBACKS.ink);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [compileDialogOpen, setCompileDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(
    (canvas: Canvas) => {
      if (isRestoringRef.current) {
        return;
      }

      const snapshot = JSON.stringify(canvas.toJSON());
      const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
      trimmed.push(snapshot);

      if (trimmed.length > HISTORY_LIMIT) {
        trimmed.shift();
      }

      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
      updateHistoryButtons();
    },
    [updateHistoryButtons],
  );

  const restoreHistory = useCallback(
    async (canvas: Canvas, index: number) => {
      const snapshot = historyRef.current[index];
      if (!snapshot) {
        return;
      }

      isRestoringRef.current = true;

      await canvas.loadFromJSON(snapshot);
      fixCanvasTextFontFamilies(canvas);
      canvas.renderAll();
      historyIndexRef.current = index;
      updateHistoryButtons();

      isRestoringRef.current = false;
    },
    [updateHistoryButtons],
  );

  const syncTextToolbar = useCallback((active: EditableText) => {
    const normalized = normalizeCanvasFontFamily(active.fontFamily);
    if (normalized !== active.fontFamily) {
      active.set({ fontFamily: normalized });
      active.initDimensions();
      fabricRef.current?.requestRenderAll();
    }

    setSelectedText(active);
    setFontFamily(normalized);
    setFontSize(active.fontSize ?? 20);
    setTextColor((active.fill as string) ?? YEARBOOK_THEME_FALLBACKS.ink);
  }, []);

  const applyTextStyleUpdates = useCallback(
    (updates: { fontFamily?: string; fontSize?: number; fill?: string }) => {
      const canvas = fabricRef.current;
      if (!canvas || !selectedText) {
        return;
      }

      applyTextStylesToObject(selectedText, updates);
      canvas.requestRenderAll();
      pushHistory(canvas);
    },
    [pushHistory, selectedText],
  );

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const active = canvas.getActiveObject();
    if (!active || !isDeletableCanvasObject(active)) {
      return;
    }

    if (isEditableText(active) && active.isEditing) {
      return;
    }

    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setSelectionKind(null);
    setSelectedText(null);
    pushHistory(canvas);
  }, [pushHistory]);

  const bindCanvasEvents = useCallback(
    (canvas: Canvas) => {
      const record = () => pushHistory(canvas);

      canvas.on("object:modified", record);
      canvas.on("object:added", record);
      canvas.on("object:removed", record);

      canvas.on("object:scaling", () => {
        const active = canvas.getActiveObject();
        if (active instanceof Textbox) {
          resizeTextboxByScaling(active);
          canvas.requestRenderAll();
        } else if (active instanceof IText) {
          resetLegacyTextScale(active);
          canvas.requestRenderAll();
        }
      });

      const handleSelection = () => {
        const active = canvas.getActiveObject();
        if (isEditableText(active)) {
          syncTextToolbar(active);
          setSelectionKind("text");
        } else if (isCanvasImage(active)) {
          setSelectedText(null);
          setSelectionKind("image");
        } else {
          setSelectedText(null);
          setSelectionKind(null);
        }
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => {
        setSelectedText(null);
        setSelectionKind(null);
      });

      canvas.on("text:editing:exited", (event) => {
        const target = event.target;
        if (!isEditableText(target)) {
          return;
        }

        syncTextObjectCharacterStyles(target);
      });
    },
    [pushHistory, syncTextToolbar],
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile || !canvasElementRef.current) {
      return;
    }

    let disposed = false;

    void (async () => {
      await preloadCanvasFonts();

      if (disposed || !canvasElementRef.current) {
        return;
      }

      const canvas = new Canvas(canvasElementRef.current, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        backgroundColor: "#ffffff",
        ...getCanvasSelectionOptions(),
      });

      fabricRef.current = canvas;
      bindCanvasEvents(canvas);
      pushHistory(canvas);
      setCanvasReady(true);

      if (hasDraft(yearbookId)) {
        setShowDraftBanner(true);
      }
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
      setCanvasReady(false);
    };
  }, [bindCanvasEvents, isMobile, pushHistory, yearbookId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (isEditableText(active) && active.isEditing) {
        return;
      }

      if (!selectionKind) {
        return;
      }

      event.preventDefault();
      deleteSelected();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, selectionKind]);

  useEffect(() => {
    if (!submitError) {
      return;
    }

    setIsSubmitting(false);
    setConfirmOpen(false);
    setPreviewOpen(false);
    setCompileDialogOpen(false);
    setToastMessage(submitError);
  }, [submitError]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function resumeDraft() {
    const canvas = fabricRef.current;
    if (!canvas) {
      setShowDraftBanner(false);
      return;
    }

    try {
      const hydrated = await loadDraftCanvas(yearbookId);
      if (!hydrated) {
        setShowDraftBanner(false);
        setToastMessage("Could not restore the saved draft.");
        return;
      }

      isRestoringRef.current = true;
      await canvas.loadFromJSON(hydrated);
      fixCanvasTextFontFamilies(canvas);
      canvas.renderAll();
      pushHistory(canvas);

      const background = canvas.backgroundColor;
      if (typeof background === "string") {
        setBackgroundColor(background);
      }

      setShowDraftBanner(false);
      setToastMessage("Draft restored.");
    } catch {
      await clearDraft(yearbookId);
      setShowDraftBanner(false);
      setToastMessage("Could not restore the saved draft.");
    } finally {
      isRestoringRef.current = false;
    }
  }

  async function discardDraft() {
    await clearDraft(yearbookId);
    setShowDraftBanner(false);
  }

  async function saveDraftToStorage() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    try {
      const canvasJson = canvas.toJSON() as Record<string, unknown>;
      await saveDraft(yearbookId, canvasJson);
      setToastMessage("Draft saved.");
    } catch {
      setToastMessage("Could not save draft. Your browser storage may be full.");
    }
  }

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const text = new Textbox("Double-click to edit", {
      left: 48,
      top: 48,
      width: DEFAULT_TEXT_WIDTH,
      fontSize,
      fill: textColor,
      fontFamily,
      splitByGrapheme: false,
      lockScalingY: true,
    });

    applyTextStylesToObject(text, { fontFamily, fontSize, fill: textColor });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  async function addImageFromFile(file: File) {
    const canvas = fabricRef.current;
    if (!canvas || !file.type.startsWith("image/")) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await FabricImage.fromURL(dataUrl);

    const maxWidth = PAGE_WIDTH * 0.6;
    if ((image.width ?? 0) > maxWidth) {
      image.scaleToWidth(maxWidth);
    }

    image.set({
      left: PAGE_WIDTH / 2 - (image.getScaledWidth() ?? 0) / 2,
      top: PAGE_HEIGHT / 2 - (image.getScaledHeight() ?? 0) / 2,
    });

    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.renderAll();
  }

  async function setBackgroundImageFromFile(file: File) {
    const canvas = fabricRef.current;
    if (!canvas || !file.type.startsWith("image/")) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await FabricImage.fromURL(dataUrl);
    const scaleX = PAGE_WIDTH / (image.width ?? PAGE_WIDTH);
    const scaleY = PAGE_HEIGHT / (image.height ?? PAGE_HEIGHT);

    image.set({
      scaleX,
      scaleY,
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
    });

    canvas.backgroundImage = image;
    canvas.backgroundVpt = false;
    canvas.renderAll();
    pushHistory(canvas);
  }

  function clearBackgroundImage() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.backgroundImage = undefined;
    canvas.renderAll();
    pushHistory(canvas);
  }

  function updateBackgroundColor(color: string) {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    setBackgroundColor(color);
    canvas.backgroundColor = color;
    canvas.renderAll();
    pushHistory(canvas);
  }

  async function resetBoard() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.backgroundImage = undefined;
    canvas.renderAll();
    pushHistory(canvas);
    setResetConfirmOpen(false);
  }

  async function compilePagePreview() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const blob = exportPageImage(canvas, PAGE_PREVIEW_EXPORT);
    hasPreviewedRef.current = true;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextUrl = URL.createObjectURL(blob);
    setPreviewUrl(nextUrl);
    setCompileDialogOpen(false);
    setPreviewOpen(true);
  }

  async function signYearbook() {
    const canvas = fabricRef.current;
    if (!canvas || !hasPreviewedRef.current) {
      setToastMessage("Preview your page before signing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const pageImageBlob = exportPageImageForSubmit(canvas);
      const formData = new FormData();
      formData.set("yearbookId", yearbookId);
      formData.set("ownerUsername", ownerUsername);
      formData.set("pageImage", new File([pageImageBlob], "entry.jpg", { type: "image/jpeg" }));
      await submitCanvasEntry(formData);
    } catch (error) {
      if (isNextNavigationError(error)) {
        await clearDraft(yearbookId);
        throw error;
      }

      setToastMessage("Could not submit your entry. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (isMobile) {
    return (
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold text-stone-700">
          For the best signing experience, please use a desktop browser.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
      {showDraftBanner ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">You have a saved draft. Resume?</p>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-yearbook-ink px-4 py-2 text-xs font-semibold text-white"
              onClick={() => void resumeDraft()}
              type="button"
            >
              Resume
            </button>
            <button
              className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-950"
              onClick={() => void discardDraft()}
              type="button"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      <MainToolbar
        backgroundColor={backgroundColor}
        canRedo={canRedo}
        canUndo={canUndo}
        onAddImage={() => imageInputRef.current?.click()}
        onAddText={addText}
        onBackgroundColorChange={updateBackgroundColor}
        onBackgroundImage={() => backgroundInputRef.current?.click()}
        onClearBackgroundImage={clearBackgroundImage}
        onRedo={() => {
          const canvas = fabricRef.current;
          if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) {
            return;
          }

          void restoreHistory(canvas, historyIndexRef.current + 1);
        }}
        onReset={() => setResetConfirmOpen(true)}
        onSaveDraft={() => void saveDraftToStorage()}
        onUndo={() => {
          const canvas = fabricRef.current;
          if (!canvas || historyIndexRef.current <= 0) {
            return;
          }

          void restoreHistory(canvas, historyIndexRef.current - 1);
        }}
      />

      <div className="selection-toolbar-slot">
        <SelectionToolbar
          fontFamily={fontFamily}
          fontSize={fontSize}
          onDelete={deleteSelected}
          onFontFamilyChange={(value) => {
            setFontFamily(value);
            applyTextStyleUpdates({ fontFamily: value });
          }}
          onFontSizeChange={(value) => {
            setFontSize(value);
            applyTextStyleUpdates({ fontSize: value });
          }}
          onTextColorChange={(value) => {
            setTextColor(value);
            applyTextStyleUpdates({ fill: value });
          }}
          selectionKind={selectionKind}
          textColor={textColor}
        />
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void addImageFromFile(file);
          }

          event.target.value = "";
        }}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void setBackgroundImageFromFile(file);
          }

          event.target.value = "";
        }}
        ref={backgroundInputRef}
        type="file"
      />

      <div className="canvas-editor-stage">
        <p className="mb-3 text-center text-sm text-stone-600">
          Edit your page below — this is what will appear in their yearbook.
        </p>
        <div
          className="canvas-editor-stage__surface"
          data-canvas-ready={canvasReady ? "true" : "false"}
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        >
          {!canvasReady ? (
            <div
              aria-hidden
              className="canvas-editor-stage__placeholder absolute inset-0 bg-white"
            />
          ) : null}
          <canvas ref={canvasElementRef} />
        </div>
      </div>

      <button
        className="mt-6 rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
        onClick={() => setCompileDialogOpen(true)}
        type="button"
      >
        Preview page
      </button>

      {toastMessage ? (
        <p className="mt-4 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
          {toastMessage}
        </p>
      ) : null}

      <Dialog open={compileDialogOpen} onOpenChange={setCompileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview your page?</DialogTitle>
            <DialogDescription>
              Ready to review your entry? We&apos;ll show you exactly how it will appear in the
              yearbook before you sign.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => setCompileDialogOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-yearbook-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void compilePagePreview()}
              type="button"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[90vh] w-[min(96vw,56rem)] max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle>Preview your page</DialogTitle>
            <DialogDescription>Review your page before you sign.</DialogDescription>
          </DialogHeader>
          {previewUrl ? (
            <div className="mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img
                alt="Entry preview"
                className="max-h-full max-w-full object-contain"
                src={previewUrl}
              />
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => setPreviewOpen(false)}
              type="button"
            >
              Go back and edit
            </button>
            <button
              className="rounded-full bg-yearbook-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setPreviewOpen(false);
                setConfirmOpen(true);
              }}
              type="button"
            >
              Sign Yearbook
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign permanently?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Once you sign, your entry is permanent and cannot be edited or
              deleted. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-yearbook-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void signYearbook()}
              type="button"
            >
              {isSubmitting ? "Signing…" : "Sign — I'm sure"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset board?</DialogTitle>
            <DialogDescription>Are you sure? This clears everything.</DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={() => setResetConfirmOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void resetBoard()}
              type="button"
            >
              Reset board
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MainToolbar({
  backgroundColor,
  canRedo,
  canUndo,
  onAddImage,
  onAddText,
  onBackgroundColorChange,
  onBackgroundImage,
  onClearBackgroundImage,
  onRedo,
  onReset,
  onSaveDraft,
  onUndo,
}: {
  backgroundColor: string;
  canRedo: boolean;
  canUndo: boolean;
  onAddImage: () => void;
  onAddText: () => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImage: () => void;
  onClearBackgroundImage: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSaveDraft: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <button
        className="rounded-full bg-yearbook-ink px-4 py-2 text-xs font-semibold text-white"
        onClick={onAddText}
        type="button"
      >
        Add Text
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
        onClick={onAddImage}
        type="button"
      >
        Add Image
      </button>
      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
        Background
        <input
          className="h-8 w-10 cursor-pointer rounded border border-stone-300"
          onChange={(event) => onBackgroundColorChange(event.target.value)}
          type="color"
          value={backgroundColor}
        />
      </label>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
        onClick={onBackgroundImage}
        type="button"
      >
        Background Image
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
        onClick={onClearBackgroundImage}
        type="button"
      >
        Clear background image
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={!canUndo}
        onClick={onUndo}
        type="button"
      >
        Undo
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={!canRedo}
        onClick={onRedo}
        type="button"
      >
        Redo
      </button>
      <button
        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700"
        onClick={onReset}
        type="button"
      >
        Reset Board
      </button>
      <button
        className="rounded-full border border-yearbook-accent px-4 py-2 text-xs font-semibold text-yearbook-accent"
        onClick={onSaveDraft}
        type="button"
      >
        Save Draft
      </button>

    </div>
  );
}


function SelectionToolbar({
  fontFamily,
  fontSize,
  onDelete,
  onFontFamilyChange,
  onFontSizeChange,
  onTextColorChange,
  selectionKind,
  textColor,
}: {
  fontFamily: string;
  fontSize: number;
  onDelete: () => void;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextColorChange: (value: string) => void;
  selectionKind: "text" | "image" | null;
  textColor: string;
}) {
  const isVisible = selectionKind !== null;

  return (
    <div
      aria-hidden={!isVisible}
      className={`flex min-h-[3.75rem] flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-yearbook-paper p-3 transition-opacity ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {selectionKind === "text" ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Text</p>
          <label className="text-xs font-semibold text-stone-700">
            Font
            <select
              className="ml-2 rounded-lg border border-stone-300 px-2 py-1 text-xs"
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
        </>
      ) : null}
      {selectionKind === "image" ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Image</p>
      ) : null}
      {isVisible ? (
        <button
          className="ml-auto rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

function isEditableText(object: FabricObject | null | undefined): object is EditableText {
  return object instanceof Textbox || object instanceof IText;
}

function isCanvasImage(object: FabricObject | null | undefined): object is FabricImage {
  return object instanceof FabricImage;
}

function isDeletableCanvasObject(object: FabricObject): object is EditableText | FabricImage {
  return isEditableText(object) || isCanvasImage(object);
}

function fixCanvasTextFontFamilies(canvas: Canvas) {
  for (const object of canvas.getObjects()) {
    if (!isEditableText(object)) {
      continue;
    }

    syncTextObjectCharacterStyles(object);
  }
}

/** Fabric stores per-character styles; object-level font/size/fill must be copied to every grapheme for multiline text. */
function syncTextObjectCharacterStyles(text: EditableText) {
  const fontFamily = normalizeCanvasFontFamily(text.fontFamily);
  const fontSize = text.fontSize ?? 20;
  const fill = (text.fill as string) ?? YEARBOOK_THEME_FALLBACKS.ink;

  applyTextStylesToObject(text, { fontFamily, fontSize, fill });
}

function applyTextStylesToObject(
  text: EditableText,
  styles: { fontFamily?: string; fontSize?: number; fill?: string },
) {
  text.set(styles);

  const length = text.text?.length ?? 0;
  if (length > 0) {
    text.setSelectionStyles(styles, 0, length);
  }

  text.initDimensions();
  text.setCoords();
}

function resizeTextboxByScaling(target: Textbox) {
  if (target.scaleX === 1 && target.scaleY === 1) {
    return;
  }

  const newWidth = Math.max((target.width ?? 0) * target.scaleX, target.minWidth ?? 20);
  target.set({
    width: newWidth,
    scaleX: 1,
    scaleY: 1,
  });
  target.initDimensions();
  target.setCoords();
}

function resetLegacyTextScale(target: IText) {
  if (target.scaleX === 1 && target.scaleY === 1) {
    return;
  }

  const scale = (target.scaleX + target.scaleY) / 2;
  target.set({
    fontSize: Math.max(8, Math.round((target.fontSize ?? 20) * scale)),
    scaleX: 1,
    scaleY: 1,
  });
  target.initDimensions();
  target.setCoords();
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
