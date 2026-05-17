# Checking signed page images

The canvas editor rasterizes each page as a **JPEG** and uploads it to Supabase Storage (`entry-pdfs` bucket) at `{yearbookId}/{userId}.jpg`. The path is stored on the entry as `page_image_url`.

Use these steps after changing export settings in `src/components/forms/canvas-entry-editor.tsx` (`compilePagePreview`).

---

## 1. Get a sample image

**From the app (before signing)**

1. Open the write flow and design a page.
2. Click **Preview page** → confirm → review the preview dialog.
3. In DevTools → **Network**, find the blob preview or inspect the preview `<img>` `src`.

**From Supabase (after signing)**

1. Dashboard → **Storage** → bucket `entry-pdfs`.
2. Open `{yearbookId}/{userId}.jpg` and download.

---

## 2. Quick format check

JPEG data URLs and files often start with the magic bytes visible in base64 as `/9j/`:

```bash
# If you saved a data URL to a file, or have the raw bytes:
xxd -l 3 your-page.jpg
# Should show: ff d8 ff
```

Or in the browser console during development, after `canvas.toDataURL`:

```ts
console.log(dataUrl.slice(0, 30));
// data:image/jpeg;base64,
```

---

## 3. Owner export PDF (dashboard)

The dashboard **Export PDF** button builds a multi-page PDF from cover, signed page images, and legacy text/PDF entries. That path uses `src/lib/yearbook/pdf-export.ts` and `src/components/yearbook/pdf-export-button.tsx`.

For JPEG pages, `pdfimages -list` on an exported yearbook PDF should show `jpeg` / `DCTDecode` for image-only entry pages.

---

## Checklist

| Check | Pass? |
|-------|-------|
| Preview `dataUrl` starts with `data:image/jpeg` | ☐ |
| Storage object is `{yearbookId}/{userId}.jpg` | ☐ |
| Flipbook shows the signed page correctly | ☐ |
| Upload succeeds (≤ 10 MB, `image/*`) | ☐ |

---

## Reference

- Export: `compilePagePreview` in `src/components/forms/canvas-entry-editor.tsx` — `format: "jpeg"`, `PAGE_EXPORT_MULTIPLIER`, `PAGE_EXPORT_JPEG_QUALITY`.
- Upload: `submitCanvasEntry` in `src/app/yearbook/[yearbookId]/write/actions.ts` (`MAX_PAGE_IMAGE_SIZE` = 10 MB).
