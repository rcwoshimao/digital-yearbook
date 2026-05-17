# Checking that compiled entries use JPEG inside the PDF

The canvas editor exports each page as a **JPEG** snapshot, embeds it in a **PDF**, and uploads that PDF to Supabase (`entry-pdfs`). The file is still named `entry.pdf` and has MIME type `application/pdf` — the JPEG is the single full-page image inside the PDF, not a separate `.jpg` upload.

Use these steps to verify the pipeline after changing export settings in `src/components/forms/canvas-entry-editor.tsx`.

---

## 1. Get a sample PDF

**From the app (before or after signing)**

1. Open the write flow and design a page.
2. Click **Compile PDF?** → confirm → preview opens.
3. Save the file:
   - Right-click inside the preview iframe → **Save as…**, or
   - DevTools → **Network** → open the preview → save the `blob:` or PDF response.

**From Supabase (after signing)**

1. Dashboard → **Storage** → bucket `entry-pdfs`.
2. Open `{yearbookId}/{userId}.pdf` and download.

Example path on your machine:

```text
~/Desktop/entry.pdf
```

---

## 2. Definitive check: `pdfimages` (recommended)

### Install once (macOS)

```bash
brew install poppler
which pdfimages
```

### List embedded images

```bash
pdfimages -list ~/Desktop/entry.pdf
```

**JPEG inside the PDF** — look for:

- Column `enc` = **`jpeg`**, or
- Filter **`DCTDecode`** in the output

**PNG** — often shows **`FlateDecode`** instead.

Example (JPEG):

```text
page   num  type   width height color comp bpc  enc interp  ...
   1     0 image    1785  2526  rgb     3   8  jpeg   no    ...
```

### Extract the embedded image (optional)

```bash
mkdir -p /tmp/pdf-test && cd /tmp/pdf-test
pdfimages -j ~/Desktop/entry.pdf extracted
ls -la extracted*
```

You should get `extracted-000.jpg` (prefix `-j` = write JPEGs when possible). Open that file to see the exact raster embedded in the PDF.

---

## 3. Quick check without Poppler

```bash
strings ~/Desktop/entry.pdf | grep -E "DCTDecode|/JPEG"
```

Seeing **`DCTDecode`** means the page image is almost certainly JPEG.

---

## 4. Browser check (canvas export only)

While developing, temporarily log in `compilePdfPreview` after `toDataURL`:

```ts
console.log(dataUrl.slice(0, 30));
```

Expected:

```text
data:image/jpeg;base64,
```

The base64 after that often starts with `/9j/` (JPEG magic bytes). This proves Fabric exported JPEG **before** jsPDF; use §2 to confirm the **saved PDF**.

You can also log PDF size:

```ts
console.log("PDF size (KB):", Math.round(blob.size / 1024));
```

Photo-heavy pages are usually much smaller as JPEG than PNG at the same multiplier.

---

## Checklist

| Check | Pass? |
|-------|-------|
| `dataUrl` starts with `data:image/jpeg` | ☐ |
| `pdfimages -list` shows `jpeg` / `DCTDecode` | ☐ |
| `pdfimages -j` produces `extracted-000.jpg` | ☐ |
| Preview / flipbook looks correct | ☐ |
| Upload succeeds (≤ 10 MB, `application/pdf`) | ☐ |

---

## Reference

Export code: `compilePdfPreview` in `src/components/forms/canvas-entry-editor.tsx` — `format: "jpeg"`, `pdf.addImage(..., "JPEG", ...)`.

Upload validation: `src/app/yearbook/[yearbookId]/write/actions.ts` (`MAX_PDF_SIZE` = 10 MB).
