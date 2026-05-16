# UI Flow Spec — Digital Yearbook App
> Addendum to `yearbook_cursor_prompt.md`. Implement these UI/UX details on top of the existing architecture.

---

## User Flow Overview

```
/login
  └── (on success) redirect to /dashboard
        ├── Default view: "My Yearbook" (entries received)
        │     ├── Invite panel (share by link or by username)
        │     └── Nav → /write
        └── /write — browse & sign other people's yearbooks
```

---

## Page 1: `/login`

**Purpose:** Entry point for all users. No content is accessible without authentication.

### Layout & Behavior
- Full-page centered layout — app name/logo at top, auth form below
- Two tabs or toggle: **Sign In** / **Sign Up**
- Sign Up collects: Display Name, University, Graduation Class (e.g. "Class of 2025"), Email, Password
- On successful login or signup → redirect immediately to `/dashboard`
- On signup, auto-create a `yearbooks` row for the new user (trigger or server-side logic on first dashboard load)

### Design Notes
- This is the first impression — make it warm and celebratory, not corporate
- Consider a subtle animated background (confetti, floating graduation caps, soft bokeh) to set tone
- Keep the form itself clean and minimal against the expressive background

---

## Page 2: `/dashboard` — "My Yearbook"

This is the **primary home screen** after login. It has one job: show the user the entries people have written for them, and give them tools to invite more people.

### Layout: Two-column on desktop, stacked on mobile

```
┌─────────────────────────────────────────────────────────┐
│  [App Logo / Name]              [User Avatar + Name]  ↗ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   "Your Yearbook"                   [Export PDF btn]    │
│   ─────────────────────────────────────────────────     │
│                                                         │
│   ┌─── Flipbook Viewer ──────────────────────────────┐  │
│   │  (entries written to this user, flip animation)  │  │
│   │                                                  │  │
│   │   ← prev        [3 / 12]        next →           │  │
│   └──────────────────────────────────────────────────┘  │
│                                                         │
│   [Search by name input]                                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  INVITE PEOPLE TO SIGN YOUR YEARBOOK                    │
│                                                         │
│  ┌── Share by Link ────────────────────────────────┐    │
│  │  yourapp.com/write/[yearbook_id]  [Copy Link]   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌── Invite by Username ───────────────────────────┐    │
│  │  [@username or User ID input]      [Invite]     │    │
│  │  Invited: @alice, @bob, @charlie  [x remove]    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Share mode: ○ Anyone with link  ● Invite only          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ✏️  Want to sign someone else's yearbook?              │
│      [Go to Write Entries →]                            │
└─────────────────────────────────────────────────────────┘
```

### Flipbook Viewer
- Use `react-pageflip` for the page-turn animation
- Each page = one entry card (author name, university, class, timestamp, text, images)
- If 0 entries: show an empty state — e.g. "No one has signed yet. Share your link to get started!"
- Keyboard: left/right arrows navigate pages
- Mobile: swipe left/right

### Entry Card (per flipbook page)
```
┌──────────────────────────────────┐
│  [Avatar initial or photo]       │
│  Name                            │
│  University · Class of 20XX      │
│  ──────────────────────────────  │
│                                  │
│  [Entry text]                    │
│                                  │
│  [Image(s) if present]           │
│                                  │
│  Signed on May 15, 2025          │
└──────────────────────────────────┘
```

### Invite Panel
- **Share by Link**: always visible regardless of share mode. Shows the write URL with a "Copy Link" button. On copy, show a brief toast: "Link copied!"
- **Invite by Username**: text input that resolves a username or user ID to a real profile (live lookup via `/api/profiles/search?q=`). On match, show the user's display name + university before confirming. On invite, adds to `yearbook_invites`. Show current invite list below with remove (×) option.
- **Share mode toggle**: radio or toggle between "Anyone with link" and "Invite only". When switched to Invite only, the copy-link section shows a note: "Only people you've invited can use this link."

### Nav to Write Page
- Persistent at the bottom of the dashboard (or in the top nav)
- Label: "Sign someone's yearbook →" or "Write Entries"
- Simple text link or button — not a tab (the two pages have very different purposes and should feel like distinct destinations)

### PDF Export
- Button top-right of the flipbook section: "Export as PDF"
- Renders all entry cards via `html2canvas` + `jspdf`, one entry per page
- File name: `[YourName]-yearbook-2025.pdf`
- Show loading state during generation (spinner or progress bar)

---

## Page 3: `/write` — "Sign a Yearbook"

**Purpose:** This is where users go to write entries in other people's yearbooks. It is entirely separate from receiving entries.

### How users arrive here
- From the dashboard nav link ("Sign someone's yearbook →")
- From following someone else's share link: `yourapp.com/write/[yearbook_id]` — this deep link skips the browse step and opens the write form directly for that yearbook

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to My Yearbook          [User Avatar + Name]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  "Sign a Yearbook"                                      │
│                                                         │
│  ┌── Find someone ─────────────────────────────────┐    │
│  │  [@username or User ID]          [Search]       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── or paste a link they shared with you ──             │
│                                                         │
│  ┌── Write Entry Form (appears after finding a user) ┐  │
│  │                                                   │  │
│  │  Writing to: [Name] · [University] · [Class]      │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Your message...                            │  │  │
│  │  │                                             │  │  │
│  │  │                                             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  [+ Add Images]  (max 5, 5MB each)               │  │
│  │                                                   │  │
│  │  From: [Your Name] · [Your University] · [Class]  │  │
│  │  (auto-filled, read-only)                         │  │
│  │                                                   │  │
│  │  ⚠ Once submitted, this entry cannot be edited.  │  │
│  │                                                   │  │
│  │                          [Submit Entry]           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── Entries I've written ──────────────────────────     │
│                                                         │
│  [List of past entries the logged-in user has authored] │
│  Name · University · Signed on [date]                   │
│  (no content shown — just the recipient + date)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Write Entry Form Behavior
- User searches by username/user ID → profile card appears confirming who they're writing to
- If they arrived via deep link (`/write/[yearbook_id]`), skip search — show the recipient's profile card immediately
- Text area: plain text, no character limit but enforce a minimum of 1 character
- Image upload: drag-and-drop or file picker via `react-dropzone`; preview thumbnails before submit
- Author info (name, university, class) is pulled from the logged-in user's profile and shown read-only — no editing
- Submit button is disabled until text is non-empty
- On submit: show a confirmation dialog — "Once submitted, you cannot edit or delete this entry. Are you sure?" → Confirm → POST to `/api/entries` → success toast → form resets

### "Entries I've Written" log
- Below the form, a simple list of all entries the current user has authored
- Shows: recipient name, their university, date signed
- Does NOT re-show the written content (keeps the mystique; the recipient's yearbook is theirs)
- This is purely a "I've already signed this person" reference so you don't accidentally sign twice

### Duplicate Entry Guard
- Before showing the write form, check if the logged-in user has already submitted an entry to that yearbook
- If yes: show a message — "You've already signed [Name]'s yearbook on [date]." and do not show the form
- Enforce this server-side too: add a unique constraint on `(yearbook_id, author_id)` in the `entries` table

```sql
alter table entries add constraint one_entry_per_author_per_yearbook
  unique (yearbook_id, author_id);
```

---

## Navigation Summary

| From | To | How |
|---|---|---|
| `/login` | `/dashboard` | Auto-redirect on auth success |
| `/dashboard` | `/write` | "Sign someone's yearbook →" link in dashboard |
| `/write` | `/dashboard` | "← Back to My Yearbook" link at top |
| External share link | `/write/[yearbook_id]` | Direct URL, skip search step |
| `/write/[yearbook_id]` | `/dashboard` | After submit, or via back link |

There is no navigation that takes a user to another user's yearbook viewer. The only "viewer" in the app is the owner's own dashboard.

---

## Global Nav Bar (persistent across all authenticated pages)

Keep it minimal — two destinations only:

```
[App Logo]       My Yearbook    Sign Yearbooks    [Avatar → Logout]
```

- "My Yearbook" = `/dashboard`
- "Sign Yearbooks" = `/write`
- Active state highlighted
- Mobile: bottom tab bar with icons

---

## Empty & Edge States to Implement

| State | Where | Message |
|---|---|---|
| No entries received yet | Dashboard flipbook | "No entries yet! Share your link to get started." + show share link prominently |
| No entries written yet | /write log | "You haven't signed anyone's yearbook yet." |
| User not found (invite/search) | Both pages | "No user found with that username." |
| Already signed | /write form | "You've already signed [Name]'s yearbook on [date]." |
| Invite-only, not invited | /write/[yearbook_id] | "This yearbook is invite-only. Ask [Name] to invite you." |
| 0 images uploaded | Entry card | Render without image section — no empty placeholder |