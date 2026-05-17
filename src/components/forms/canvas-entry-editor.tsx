"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, IText, Textbox, type FabricObject } from "fabric";
import { jsPDF } from "jspdf";
import { submitPdfEntry } from "@/app/yearbook/[yearbookId]/write/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearDraft, readDraft, writeDraft } from "@/lib/canvas/draft";
import {
  configureCanvasSelectionOverlay,
  getCanvasSelectionOptions,
} from "@/lib/canvas/selection-overlay";
import { isNextNavigationError } from "@/lib/next/is-redirect-error";

configureCanvasSelectionOverlay();

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HISTORY_LIMIT = 30;
const MOBILE_MAX_WIDTH = 767;

const DEFAULT_TEXT_WIDTH = 320;

const FONT_OPTIONS = [
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
  { label: "Handwritten", value: "Caveat, cursive" },
] as const;

type EditableText = Textbox | IText;

type CanvasEntryEditorProps = {
  authorClass: string | null;
  authorName: string;
  authorUniversity: string | null;
  isSampleMode?: boolean;
  ownerUsername: string;
  submitError?: string | null;
  yearbookId: string;
};

export function CanvasEntryEditor({
  authorClass,
  authorName,
  authorUniversity,
  isSampleMode = false,
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
  const compiledPdfRef = useRef<Blob | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedText, setSelectedText] = useState<EditableText | null>(null);
  const [fontFamily, setFontFamily] = useState<string>(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState("#27211b");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [compileDialogOpen, setCompileDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
      canvas.renderAll();
      historyIndexRef.current = index;
      updateHistoryButtons();

      isRestoringRef.current = false;
    },
    [updateHistoryButtons],
  );

  const syncTextToolbar = useCallback((active: EditableText) => {
    setSelectedText(active);
    setFontFamily(normalizeFontFamily(active.fontFamily));
    setFontSize(active.fontSize ?? 20);
    setTextColor((active.fill as string) ?? "#27211b");
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
        } else {
          setSelectedText(null);
        }
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => setSelectedText(null));
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
    if (isMobile || isSampleMode || !canvasElementRef.current) {
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

    if (readDraft(yearbookId)) {
      setShowDraftBanner(true);
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [bindCanvasEvents, isMobile, isSampleMode, pushHistory, yearbookId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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

  function canvasHasImages(canvas: Canvas) {
    return canvas.getObjects().some((object) => isImageObject(object));
  }

  function getDraftPayload(canvas: Canvas) {
    const json = canvas.toJSON() as {
      backgroundImage?: unknown;
      objects?: Array<{ type?: string }>;
    };

    if (json.objects) {
      json.objects = json.objects.filter(
        (object) => object.type !== "image" && object.type !== "Image",
      );
    }

    delete json.backgroundImage;

    return JSON.stringify(json);
  }

  async function resumeDraft() {
    const canvas = fabricRef.current;
    const raw = readDraft(yearbookId);

    if (!canvas || !raw) {
      setShowDraftBanner(false);
      return;
    }

    try {
      isRestoringRef.current = true;
      await canvas.loadFromJSON(raw);
      canvas.renderAll();
      pushHistory(canvas);
      setShowDraftBanner(false);
      setToastMessage("Draft restored.");
    } catch {
      clearDraft(yearbookId);
      setShowDraftBanner(false);
      setToastMessage("Could not restore the saved draft.");
    } finally {
      isRestoringRef.current = false;
    }
  }

  function discardDraft() {
    clearDraft(yearbookId);
    setShowDraftBanner(false);
  }

  function saveDraft() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    try {
      writeDraft(yearbookId, getDraftPayload(canvas));
      setToastMessage(
        canvasHasImages(canvas)
          ? "Draft saved. Note: images are not preserved in drafts and will need to be re-added."
          : "Draft saved.",
      );
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
      originX: "left",
      originY: "top",
    });

    canvas.backgroundImage = image;
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

  async function compilePdfPreview() {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    const pdf = new jsPDF({ unit: "px", format: [PAGE_WIDTH, PAGE_HEIGHT] });
    pdf.addImage(dataUrl, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const blob = pdf.output("blob");
    compiledPdfRef.current = blob;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextUrl = URL.createObjectURL(blob);
    setPreviewUrl(nextUrl);
    setCompileDialogOpen(false);
    setPreviewOpen(true);
  }

  async function signYearbook() {
    if (isSampleMode) {
      return;
    }

    const pdfBlob = compiledPdfRef.current;
    if (!pdfBlob) {
      setToastMessage("Compile your entry into a PDF before signing.");
      return;
    }

    setIsSubmitting(true);
    clearDraft(yearbookId);

    try {
      const formData = new FormData();
      formData.set("yearbookId", yearbookId);
      formData.set("ownerUsername", ownerUsername);
      formData.set("pdf", new File([pdfBlob], "entry.pdf", { type: "application/pdf" }));
      await submitPdfEntry(formData);
    } catch (error) {
      if (isNextNavigationError(error)) {
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
      {isSampleMode ? (
        <p className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Sample mode is read-only, so this editor will not submit to Supabase.
        </p>
      ) : null}

      {showDraftBanner ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">You have a saved draft. Resume?</p>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-yearbook-ink px-4 py-2 text-xs font-semibold text-white"
              onClick={resumeDraft}
              type="button"
            >
              Resume
            </button>
            <button
              className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-950"
              onClick={discardDraft}
              type="button"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      <Toolbar
        backgroundColor={backgroundColor}
        canRedo={canRedo}
        canUndo={canUndo}
        fontFamily={fontFamily}
        fontSize={fontSize}
        isSampleMode={isSampleMode}
        onAddImage={() => imageInputRef.current?.click()}
        onAddText={addText}
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
        onSaveDraft={saveDraft}
        onUndo={() => {
          const canvas = fabricRef.current;
          if (!canvas || historyIndexRef.current <= 0) {
            return;
          }

          void restoreHistory(canvas, historyIndexRef.current - 1);
        }}
        selectedText={selectedText}
        textColor={textColor}
      />

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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-100 p-4">
        <canvas ref={canvasElementRef} />
      </div>

      <div className="mt-6 rounded-2xl bg-yearbook-paper p-4">
        <p className="text-sm font-semibold text-stone-700">From</p>
        <p className="mt-1 text-lg font-bold">{authorName}</p>
        <p className="text-sm text-stone-600">
          {[authorUniversity, authorClass].filter(Boolean).join(" · ") || "No school details yet"}
        </p>
        <p className="mt-3 text-xs font-semibold text-amber-800">
          Once submitted, this entry cannot be edited.
        </p>
      </div>

      <button
        className="mt-6 rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSampleMode}
        onClick={() => setCompileDialogOpen(true)}
        type="button"
      >
        Compile PDF?
      </button>

      {toastMessage ? (
        <p className="mt-4 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
          {toastMessage}
        </p>
      ) : null}

      <Dialog open={compileDialogOpen} onOpenChange={setCompileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compile your entry?</DialogTitle>
            <DialogDescription>
              Ready to preview your entry? We&apos;ll compile it into a PDF for you to review before
              signing.
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
              onClick={() => void compilePdfPreview()}
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
            <DialogDescription>Review the compiled PDF before you sign.</DialogDescription>
          </DialogHeader>
          {previewUrl ? (
            <iframe className="mt-4 min-h-0 flex-1 rounded-xl border border-stone-200" src={previewUrl} title="Entry preview" />
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
              disabled={isSampleMode || isSubmitting}
              onClick={() => void signYearbook()}
              type="button"
            >
              {isSampleMode ? "Sample mode" : isSubmitting ? "Uploading PDF…" : "Sign — I'm sure"}
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

function Toolbar({
  backgroundColor,
  canRedo,
  canUndo,
  fontFamily,
  fontSize,
  isSampleMode,
  onAddImage,
  onAddText,
  onBackgroundColorChange,
  onBackgroundImage,
  onClearBackgroundImage,
  onFontFamilyChange,
  onFontSizeChange,
  onRedo,
  onReset,
  onSaveDraft,
  onTextColorChange,
  onUndo,
  selectedText,
  textColor,
}: {
  backgroundColor: string;
  canRedo: boolean;
  canUndo: boolean;
  fontFamily: string;
  fontSize: number;
  isSampleMode: boolean;
  onAddImage: () => void;
  onAddText: () => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImage: () => void;
  onClearBackgroundImage: () => void;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onRedo: () => void;
  onReset: () => void;
  onSaveDraft: () => void;
  onTextColorChange: (value: string) => void;
  onUndo: () => void;
  selectedText: EditableText | null;
  textColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="rounded-full bg-yearbook-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        disabled={isSampleMode}
        onClick={onAddText}
        type="button"
      >
        Add Text
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={isSampleMode}
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
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={isSampleMode}
        onClick={onBackgroundImage}
        type="button"
      >
        Background Image
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={isSampleMode}
        onClick={onClearBackgroundImage}
        type="button"
      >
        Clear background image
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={!canUndo || isSampleMode}
        onClick={onUndo}
        type="button"
      >
        Undo
      </button>
      <button
        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
        disabled={!canRedo || isSampleMode}
        onClick={onRedo}
        type="button"
      >
        Redo
      </button>
      <button
        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
        disabled={isSampleMode}
        onClick={onReset}
        type="button"
      >
        Reset Board
      </button>
      <button
        className="rounded-full border border-yearbook-accent px-4 py-2 text-xs font-semibold text-yearbook-accent disabled:opacity-50"
        disabled={isSampleMode}
        onClick={onSaveDraft}
        type="button"
      >
        Save Draft
      </button>

      {selectedText ? (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-yearbook-paper p-3">
          <label className="text-xs font-semibold text-stone-700">
            Font
            <select
              className="ml-2 rounded-lg border border-stone-300 px-2 py-1 text-xs"
              onChange={(event) => onFontFamilyChange(event.target.value)}
              value={fontFamily}
            >
              {FONT_OPTIONS.map((option) => (
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
        </div>
      ) : null}
    </div>
  );
}

function isImageObject(object: FabricObject) {
  return object.type === "image" || object.type === "Image";
}

function isEditableText(object: FabricObject | null | undefined): object is EditableText {
  return object instanceof Textbox || object instanceof IText;
}

function normalizeFontFamily(value: string | undefined) {
  if (!value) {
    return FONT_OPTIONS[0].value;
  }

  const lowered = value.toLowerCase();
  if (lowered.includes("caveat") || lowered.includes("--font-caveat")) {
    return FONT_OPTIONS[3].value;
  }

  for (const option of FONT_OPTIONS) {
    const primary = option.value
      .split(",")[0]
      .replace(/['"]/g, "")
      .trim()
      .toLowerCase();
    if (lowered.includes(primary)) {
      return option.value;
    }
  }

  return value;
}

function applyTextStylesToObject(
  text: EditableText,
  styles: { fontFamily?: string; fontSize?: number; fill?: string },
) {
  text.set(styles);
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
