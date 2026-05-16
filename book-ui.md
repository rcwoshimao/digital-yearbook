# Cursor Prompt: Flipbook Viewer + Entry Styling
> Addendum to `yearbook_cursor_prompt.md` and `yearbook_ui_flow.md`.
> This prompt covers two focused implementation steps.

---

## Step 1: Flipbook Viewer on the Dashboard

### Goal
Replace whatever list or grid currently renders entries on `/dashboard` with a realistic page-flip book viewer. The user should feel like they are physically flipping through a yearbook.

### Library
Use **`react-pageflip`** (`npm install react-pageflip`).
- Wrap the book in a fixed-size container centered on the page
- Render two pages side-by-side on desktop (left page + right page), single page on mobile
- The first left page should be a decorative cover page: user's name, graduation class, university, and a "Class of 20XX" title. Style it like a book cover.

### Book Structure
```
[Cover Page] [Entry 1] [Entry 2] [Entry 3] ... [Back Cover]
```
- Cover page: static, always first, not an entry
- Back cover: static, always last, blank or decorative
- Each entry occupies exactly one page
- Pages turn with a realistic curl animation on click or drag

### Implementation Details
- Wrap `HTMLFlipBook` from `react-pageflip` in a `<YearbookBook>` component
- Each child of `HTMLFlipBook` must be a `<PageWrapper>` — a `forwardRef` div with fixed dimensions
- Page dimensions: **550px wide × 733px tall** on desktop (standard book ratio). Scale down proportionally on smaller screens using a wrapper that observes viewport width.
- Pass `drawShadow={true}`, `showCover={true}`, `mobileScrollSupport={true}` as props
- Navigation: render left `‹` and right `›` arrow buttons outside the book (not inside page children). Wire them to `bookRef.current.pageFlip().flipPrev()` and `.flipNext()`.
- Page number indicator below the book: "3 / 12" format
- Keyboard: left/right arrow keys call the same flip methods via a `useEffect` event listener

### Responsive Behavior
- Desktop (≥ 1024px): two-page spread
- Tablet (640–1023px): single page, width ~420px
- Mobile (< 640px): single page, full width minus 32px padding, recalculate height proportionally

### Empty State
If the user has no entries yet, show a single "empty" page inside the book with centered text:
> "No one has signed yet. Share your link and come back!"
Show the share link prominently below this message.

---

## Step 2: Entry Styling — Customization Panel on the Write Form

### Goal
When an author writes an entry on `/write`, they can customize how their page looks in the recipient's yearbook. The choices are saved as a `style_config` JSON column on the entry. The book viewer reads this JSON and renders each page accordingly. There is only **one page layout** for now — customization is purely visual (colors, font, pattern).

### Database Change
Add a column to the `entries` table:
```sql
alter table entries
  add column style_config jsonb not null default '{
    "background_color": "#fffdf5",
    "pattern": "none",
    "font": "serif",
    "ink_color": "#1a1a1a",
    "border": "none"
  }';
```
This column is set at insert time and never updated (immutability still applies).

### Style Options to Support

#### Background Color
A row of 8 color swatches the author clicks to select. Suggested palette (warm, yearbook-appropriate):
| Name | Hex |
|---|---|
| Cream (default) | `#fffdf5` |
| Blush | `#fdecea` |
| Mint | `#e8f5f0` |
| Sky | `#e8f0fd` |
| Lavender | `#f0e8fd` |
| Sunflower | `#fdf8e1` |
| Rose | `#fde8f0` |
| Slate | `#e8edf5` |

#### Page Pattern (overlaid on background color)
A subtle texture rendered as a CSS background on top of the solid color. Use CSS only — no image assets needed.
| Pattern key | CSS implementation |
|---|---|
| `none` | no additional background |
| `lined` | repeating horizontal lines, 1px `rgba(0,0,0,0.07)` every 28px |
| `dotted` | CSS radial-gradient dot grid, 2px dots every 20px |
| `grid` | thin crosshatch grid, 1px lines every 24px |

#### Font
3 options rendered as a live preview label:
| Font key | CSS font stack | Preview label |
|---|---|---|
| `serif` (default) | `'Georgia', serif` | Classic |
| `handwritten` | `'Caveat', cursive` (load from Google Fonts) | Handwritten |
| `mono` | `'Courier New', monospace` | Typewriter |

#### Ink Color (text color)
4 options as small circular swatches:
- Ink Black `#1a1a1a` (default)
- Navy `#1a2e4a`
- Forest `#1a3a2a`
- Burgundy `#4a1a1a`

#### Border
A decorative border around the page edge. Rendered as an inset CSS border or box-shadow on the page.
| Border key | Style |
|---|---|
| `none` (default) | no border |
| `classic` | 2px solid `rgba(0,0,0,0.15)`, inset 12px |
| `double` | double border: 1px solid outer, 1px solid inner with 8px gap |
| `corner` | decorative corner marks only (CSS pseudo-elements, no full border) |

### Customization Panel UI (on `/write` page)

Place the panel **to the right of or below the text area**, depending on screen size. It should show a **live preview** of the page as the author adjusts options.

```
┌─── Decorate Your Page ──────────────────────────────────┐
│                                                         │
│  Background                                             │
│  [■ cream] [■ blush] [■ mint] [■ sky]                   │
│  [■ lavender] [■ sunflower] [■ rose] [■ slate]          │
│                                                         │
│  Pattern                                                │
│  [○ None] [○ Lined] [○ Dotted] [○ Grid]                 │
│                                                         │
│  Font                                                   │
│  [○ Classic] [○ Handwritten] [○ Typewriter]             │
│                                                         │
│  Ink Color                                              │
│  [● ink black] [○ navy] [○ forest] [○ burgundy]         │
│                                                         │
│  Border                                                 │
│  [○ None] [○ Classic] [○ Double] [○ Corner]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Live Preview
- Next to (or above) the customization panel, render a **scaled-down version of the page** (roughly 40% scale using CSS `transform: scale(0.4)`) that updates in real time as the author changes options
- The preview shows: the background color + pattern, a few lines of their typed text in the chosen font and ink color, and the border
- Label it "Preview" above the scaled page
- This is purely a frontend React state update — no API calls needed for preview

### Saving style_config on Submit
When the author submits the entry form, include `style_config` in the POST body:
```json
{
  "yearbook_id": "...",
  "content_text": "...",
  "image_urls": [],
  "style_config": {
    "background_color": "#fdecea",
    "pattern": "lined",
    "font": "handwritten",
    "ink_color": "#1a2e4a",
    "border": "classic"
  }
}
```
The API route writes this as-is into the `style_config` jsonb column. No validation beyond checking all keys are present.

### Rendering style_config in the Flipbook

Each `<PageWrapper>` in the flipbook reads the entry's `style_config` and applies styles:

```tsx
// Pseudocode for the page renderer
function EntryPage({ entry }) {
  const { background_color, pattern, font, ink_color, border } = entry.style_config;

  return (
    <div
      style={{
        backgroundColor: background_color,
        fontFamily: fontMap[font],
        color: ink_color,
        // pattern applied via a CSS class
        // border applied via a CSS class
      }}
      className={`page-base pattern-${pattern} border-${border}`}
    >
      <AuthorHeader entry={entry} />
      <EntryBody text={entry.content_text} images={entry.image_urls} />
      <EntryFooter timestamp={entry.created_at} />
    </div>
  );
}
```

Define `.pattern-lined`, `.pattern-dotted`, `.pattern-grid` as utility CSS classes (or Tailwind `@apply` blocks) that add the background pattern on top of the solid color using `background-image`.

---

## Build Order

1. Install `react-pageflip` and `Caveat` Google Font
2. Build `<YearbookBook>` with static cover + dummy pages to confirm flip animation works
3. Wire real entries into the flipbook pages with basic unstyled `<EntryPage>`
4. Add `style_config` column to Supabase
5. Build the customization panel on `/write` with live preview (local state only)
6. Apply `style_config` rendering in `<EntryPage>` (CSS classes + inline styles)
7. Wire `style_config` into the POST on submit
8. Test a full round-trip: write styled entry → appears correctly styled in recipient's flipbook