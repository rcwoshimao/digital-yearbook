# Cursor Prompt: Canvas Entry Editor

> Replaces the current text-only write form. This is a desktop-first feature.
> Stack: `fabric.js` for canvas, `jsPDF` for PDF, `shadcn/ui Dialog` for confirmations, `localStorage` for manual drafts.


NOTE: Two things worth flagging before you run this:

**The schema change at the bottom is important.** The flipbook currently expects `content_text` — the fallback logic ensures old entries don't break when you add the new PDF-based flow. Tell Cursor to handle both cases in the page renderer.

**The image exclusion from draft JSON** is the sneaky one to get right. Fabric stores images as base64 inline by default, so if Cursor doesn't filter those out before `localStorage.setItem()`, a user with a couple photos will silently hit the 5MB cap and the save will fail with no feedback. The prompt specifies filtering `type === 'image'` objects — make sure Cursor actually implements that check.

---

## Setup

```bash
npm install fabric jspdf
```

Show a notice on mobile (< 768px): "For the best signing experience, please use a desktop browser." Disable the canvas editor on mobile entirely.

---

## Canvas Editor (`/write/[yearbook_id]`)

Build the editor using a `<canvas>` ref with fabric.js initialized in `useEffect`. The canvas represents a single page — fixed at **595 x 842px** (A4, matches the final PDF dimensions exactly so there's no reflow surprise on export).

### Toolbar (above the canvas)
Give the user these controls:

- **Add Text** — adds a fabric `IText` box, default font size 20, editable on double-click. Font family picker with at least: serif, sans-serif, monospace, and Caveat (handwritten). Font size slider. Text color picker.
- **Add Image** — file input, loads image onto canvas as a fabric `Image` object, draggable and resizable
- **Background Color** — color picker that sets `canvas.setBackgroundColor()`
- **Background Image** — file input that sets `canvas.setBackgroundImage()`, with a "clear background image" button
- **Undo / Redo** — maintain a manual state stack: push `canvas.toJSON()` to a `history` array on every canvas modification (`canvas.on('object:modified', ...)`, `canvas.on('object:added', ...)`, `canvas.on('object:removed', ...)`). Undo pops and calls `canvas.loadFromJSON()`. Cap history at 30 states.
- **Reset Board** — clears canvas entirely after a single inline confirmation ("Are you sure? This clears everything.")
- **Save Draft** — see below

### Draft Saving (manual, localStorage only)
- "Save Draft" button saves `canvas.toJSON()` to `localStorage` key `draft:[yearbook_id]`
- On save, if the canvas contains any images, show a toast: "Draft saved. Note: images are not preserved in drafts and will need to be re-added."
- On page load, if a draft exists for this `yearbook_id`, show a banner: "You have a saved draft. Resume?" with Resume / Discard options
- Drafts store text, positions, fonts, colors only — exclude image objects from the JSON before saving by filtering `canvas.toJSON().objects` and removing any object where `type === 'image'`

---

## Submission Flow

### Step 1 — "Compile PDF?" button
Sits below the canvas. On click, open a shadcn `<Dialog>`:
> "Ready to preview your entry? We'll compile it into a PDF for you to review before signing."

Confirm → run:
```js
const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
const pdf = new jsPDF({ unit: 'px', format: [595, 842] });
pdf.addImage(dataURL, 'PNG', 0, 0, 595, 842);
const blobUrl = URL.createObjectURL(pdf.output('blob'));
```
Open the blob URL in an `<iframe>` preview modal (full-screen dialog, ~90vh).

### Step 2 — Preview Modal
Shows the PDF in an iframe. Two buttons at the bottom:
- **"Go back and edit"** — closes modal, returns to canvas as-is
- **"Sign Yearbook"** — opens final confirmation dialog

### Step 3 — Final Confirmation Dialog
> "This cannot be undone. Once you sign, your entry is permanent and cannot be edited or deleted. Are you sure?"

Two buttons: **Cancel** and **"Sign — I'm sure"**

On confirm:
1. Export PDF blob
2. Upload to Supabase Storage at path `entries/[yearbook_id]/[author_id].pdf`
3. Insert entry record into `entries` table with `pdf_url` instead of `content_text`/`image_urls`
4. Clear the localStorage draft for this `yearbook_id`
5. Redirect to `/dashboard` with a success toast: "You've signed the yearbook!"

---

## Schema Change
Add `pdf_url text` column to `entries` table. Make `content_text` nullable since it's no longer used.

```sql
alter table entries add column pdf_url text;
alter table entries alter column content_text drop not null;
```

The flipbook viewer should check: if `pdf_url` is present, render it in an `<iframe>` or as an `<img>` (rasterized). If not (legacy entries), fall back to rendering `content_text` as before.