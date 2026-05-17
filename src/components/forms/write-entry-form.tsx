"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createEntry } from "@/app/yearbook/[yearbookId]/write/actions";
import {
  backgroundOptions,
  borderOptions,
  defaultYearbookPageStyle,
  fontFamilyByStyle,
  fontOptions,
  inkOptions,
  patternOptions,
  type YearbookPageStyle,
} from "@/lib/yearbook/page-style";

type WriteEntryFormProps = {
  authorClass: string | null;
  authorName: string;
  authorUniversity: string | null;
  isSampleMode?: boolean;
  ownerUsername: string;
  yearbookId: string;
};

export function WriteEntryForm({
  authorClass,
  authorName,
  authorUniversity,
  isSampleMode = false,
  ownerUsername,
  yearbookId,
}: WriteEntryFormProps) {
  const [contentText, setContentText] = useState("");
  const [styleConfig, setStyleConfig] = useState<YearbookPageStyle>(defaultYearbookPageStyle);
  const { acceptedFiles, getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });
  const previews = useMemo(
    () =>
      acceptedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [acceptedFiles],
  );
  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);
  const canSubmit = contentText.trim().length > 0;

  return (
    <form
      action={isSampleMode ? undefined : createEntry}
      className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-stone-200"
      onSubmit={(event) => {
        if (
          isSampleMode ||
          !canSubmit ||
          !window.confirm("Once submitted, you cannot edit or delete this entry. Are you sure?")
        ) {
          event.preventDefault();
        }
      }}
    >
      {isSampleMode ? (
        <p className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Sample mode is read-only, so this form will not submit to Supabase.
        </p>
      ) : null}
      <input name="ownerUsername" type="hidden" value={ownerUsername} />
      <input name="yearbookId" type="hidden" value={yearbookId} />
      <input name="styleConfig" type="hidden" value={JSON.stringify(styleConfig)} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <label className="block text-sm font-semibold text-stone-700" htmlFor="contentText">
            Your message
          </label>
          <textarea
            id="contentText"
            name="contentText"
            className="mt-2 min-h-80 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-yearbook-accent"
            onChange={(event) => setContentText(event.target.value)}
            placeholder="Write your graduation memory..."
            value={contentText}
          />
        </div>
        <PageDecorationPanel
          contentText={contentText}
          onChange={setStyleConfig}
          styleConfig={styleConfig}
        />
      </div>
      <div
        {...getRootProps()}
        className="mt-6 cursor-pointer rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600 transition hover:border-yearbook-accent"
      >
        <input {...getInputProps({ name: "images" })} />
        <span className="font-semibold text-stone-700">+ Add Images</span>
        <span className="mt-1 block">
          {isDragActive ? "Drop images here." : "Drag and drop or click to upload. Max 5 images, 5MB each."}
        </span>
      </div>
      {previews.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview) => (
            <img
              alt={preview.name}
              className="h-28 w-full rounded-2xl object-cover"
              key={preview.url}
              src={preview.url}
            />
          ))}
        </div>
      ) : null}
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
        disabled={isSampleMode || !canSubmit}
      >
        {isSampleMode ? "Sample Mode Only" : "Submit Entry"}
      </button>
    </form>
  );
}

function PageDecorationPanel({
  contentText,
  onChange,
  styleConfig,
}: {
  contentText: string;
  onChange: (styleConfig: YearbookPageStyle) => void;
  styleConfig: YearbookPageStyle;
}) {
  function updateStyle(nextStyle: Partial<YearbookPageStyle>) {
    onChange({ ...styleConfig, ...nextStyle });
  }

  return (
    <aside className="rounded-[1.5rem] border border-stone-200 bg-yearbook-paper p-4">
      <p className="text-sm font-bold text-yearbook-ink">Decorate Your Page</p>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Preview</p>
        <div className="h-[310px] overflow-hidden rounded-2xl bg-white/70 p-3">
          <div className="origin-top-left scale-[0.4]">
            <PreviewPage contentText={contentText} styleConfig={styleConfig} />
          </div>
        </div>
      </div>

      <OptionGroup label="Background">
        <div className="grid grid-cols-4 gap-2">
          {backgroundOptions.map((option) => (
            <button
              aria-label={option.label}
              className={`h-9 rounded-xl border-2 ${
                styleConfig.background_color === option.value
                  ? "border-yearbook-accent"
                  : "border-white"
              } shadow-sm`}
              key={option.value}
              onClick={() => updateStyle({ background_color: option.value })}
              style={{ backgroundColor: option.value }}
              type="button"
            />
          ))}
        </div>
      </OptionGroup>

      <SegmentedOptions
        label="Pattern"
        options={patternOptions}
        selectedValue={styleConfig.pattern}
        onSelect={(pattern) => updateStyle({ pattern })}
      />
      <SegmentedOptions
        label="Font"
        options={fontOptions}
        selectedValue={styleConfig.font}
        onSelect={(font) => updateStyle({ font })}
      />

      <OptionGroup label="Ink Color">
        <div className="flex flex-wrap gap-2">
          {inkOptions.map((option) => (
            <button
              aria-label={option.label}
              className={`h-8 w-8 rounded-full border-2 ${
                styleConfig.ink_color === option.value ? "border-yearbook-accent" : "border-white"
              } shadow-sm`}
              key={option.value}
              onClick={() => updateStyle({ ink_color: option.value })}
              style={{ backgroundColor: option.value }}
              type="button"
            />
          ))}
        </div>
      </OptionGroup>

      <SegmentedOptions
        label="Border"
        options={borderOptions}
        selectedValue={styleConfig.border}
        onSelect={(border) => updateStyle({ border })}
      />
    </aside>
  );
}

function OptionGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      {children}
    </div>
  );
}

function SegmentedOptions<T extends string>({
  label,
  onSelect,
  options,
  selectedValue,
}: {
  label: string;
  onSelect: (value: T) => void;
  options: readonly { label: string; value: T }[];
  selectedValue: T;
}) {
  return (
    <OptionGroup label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              selectedValue === option.value
                ? "bg-yearbook-ink text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200"
            }`}
            key={option.value}
            onClick={() => onSelect(option.value)}
            style={label === "Font" ? { fontFamily: fontFamilyByStyle[option.value as keyof typeof fontFamilyByStyle] } : undefined}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </OptionGroup>
  );
}

function PreviewPage({
  contentText,
  styleConfig,
}: {
  contentText: string;
  styleConfig: YearbookPageStyle;
}) {
  const patternClass =
    styleConfig.pattern === "none" ? "" : `yearbook-pattern-${styleConfig.pattern}`;
  const borderClass =
    styleConfig.border === "none" || styleConfig.border === "corner"
      ? ""
      : `yearbook-border-${styleConfig.border}`;

  return (
    <div
      className={`relative h-[733px] w-[550px] rounded-3xl p-12 shadow-sm ${patternClass} ${borderClass}`}
      style={{
        backgroundColor: styleConfig.background_color,
        color: styleConfig.ink_color,
        fontFamily: fontFamilyByStyle[styleConfig.font],
      }}
    >
      {styleConfig.border === "corner" ? (
        <>
          <span className="absolute left-6 top-6 h-16 w-16 border-l-4 border-t-4 border-current/30" />
          <span className="absolute bottom-6 right-6 h-16 w-16 border-b-4 border-r-4 border-current/30" />
        </>
      ) : null}
      <p className="border-b border-current/20 pb-4 text-3xl font-bold">Your page</p>
      <p className="mt-8 whitespace-pre-wrap text-2xl leading-10">
        {contentText || "Your message preview will appear here as you type."}
      </p>
    </div>
  );
}
