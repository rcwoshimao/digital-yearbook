# Digital Yearbook

A full-stack graduation yearbook where graduates collect signed pages from friends, browse them in an interactive flipbook, and export the whole book as a PDF. Friends sign yearbooks on a desktop canvas editor with text, photos, stickers, and freehand drawing.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (Auth, Postgres, Storage), Fabric.js, Framer Motion, deployed to Cloudflare Workers via OpenNext.

---

## Features

### Authentication & profiles
- Google OAuth sign-in (production); optional email/username login in local dev
- Profile with display name, username, university, and graduation class
- Profile settings page for updating account details

### My Yearbook (`/dashboard`)
- Interactive flipbook viewer with cover, signed pages, and back cover
- Search entries by author name
- Share yearbook via link (`/write/[username]`) or invite specific users by username
- Share modes: **Anyone with link** or **Invite only**
- Export the full yearbook as a downloadable PDF

### Sign a yearbook (`/write`)
- Write hub listing yearbooks you can sign (invited or previously signed)
- Desktop canvas editor (Fabric.js) for creating a signed page:
  - Text with font, size, and color controls
  - Image upload, background color/image, stickers, and freehand drawing
  - Undo/redo, reset, and draft saving
- Preview before signing; entries are permanent once submitted
- One entry per author per yearbook (enforced in the database and UI)
- Mobile users see a notice to use desktop for signing

### Entry display
- Signed pages stored as raster images in Supabase Storage
- Flipbook renders each entry as a book spread with author metadata
- Legacy text/image entries still supported for older records

---

## App architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Workers (OpenNext)               │
│  Next.js 15 App Router · Server Components · Server Actions     │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌─────────────┐     ┌──────────────┐
   │  Supabase │      │  Supabase   │     │   Browser    │
   │   Auth    │      │  Postgres   │     │  (client)    │
   │  (Google) │      │  + RLS      │     │ Fabric.js    │
   └───────────┘      └─────────────┘     │ Framer Motion│
                             │             │ IndexedDB    │
                             ▼             └──────────────┘
                      ┌─────────────┐
                      │  Supabase   │
                      │  Storage    │
                      │ (entry-pdfs)│
                      └─────────────┘
```

### Frontend
- **Pages:** `/login`, `/dashboard`, `/write`, `/write/[username]`, `/profile/[username]`
- **Flipbook:** Custom Framer Motion 3D page-turn animation with spread layout (cover + content + back cover)
- **Canvas editor:** Client-side Fabric.js canvas sized to match the book page; exports a PNG for upload on submit
- **Drafts:** Canvas state in `localStorage`; image blobs in IndexedDB so drafts survive refresh without hitting storage limits

### Backend
- **Server Actions** for auth, profile updates, entry submission, invites, and share-mode changes
- **API routes** for search and yearbook/entry lookups where needed
- **Middleware** refreshes Supabase sessions and normalizes dev URLs to `localhost`

### Data model (Supabase Postgres)
| Table | Purpose |
|-------|---------|
| `profiles` | User display info and username |
| `yearbooks` | One per user; share mode (`link` / `invite_only`) |
| `yearbook_invites` | Explicit invites for invite-only yearbooks |
| `entries` | Signed pages with page image URL, style config, and author snapshot |

Row Level Security (RLS) controls who can read yearbooks, write entries, and manage invites. A database trigger creates profile + yearbook rows on signup.

### Deployment
- Built with `@opennextjs/cloudflare` and deployed to Cloudflare Workers
- Requires **Node 22** for Wrangler/OpenNext builds
- See `docs/cloudflare-deploy.md` and `docs/final-deployment.md` for production setup

---

## Challenges faced

### Canvas editor & storage
Fabric.js stores images as inline base64 by default, which quickly exceeds `localStorage` limits. Draft saving splits text/layout into `localStorage` and image blobs into IndexedDB, with explicit filtering so large drafts fail gracefully instead of silently.

### WYSIWYG page sizing
The editor canvas, flipbook page dimensions, and exported PDF all share the same page size so what users design is what appears in the yearbook and export.

### Flipbook animation
`react-pageflip` was replaced with a custom Framer Motion implementation for better control over spread layout, cover/back-cover flow, and mobile vs desktop behavior.

### Supabase RLS & entry submission
Insert policies for entries required careful alignment with invite-only vs link-share modes. A dedicated migration (`0007_fix_entry_submit_rls.sql`) fixed cases where invited users could not submit entries.

### Auth across local and production
Google OAuth redirect URLs must include both `localhost` and the Cloudflare Workers URL in Supabase. Without that, sign-in from local dev can bounce to production. Middleware redirects LAN IPs to `localhost` in development to keep OAuth consistent.

### Cloudflare Workers deployment
Next.js on Workers needs OpenNext (`cf:build` / `cf:deploy`), Node 22, and build-time env vars (`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_APP_URL`). Preview branches need an explicit build step before `wrangler upload`.

### Permanent entries
Entries cannot be edited after signing. The UI uses preview + confirmation dialogs, and the database enforces one entry per author per yearbook.

---

## Getting started

### Prerequisites
- Node.js 22+
- A Supabase project with migrations applied (`supabase/migrations/`)

### Local development

```bash
npm install
```

Add Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply migrations in the Supabase SQL editor (or CLI), configure Google auth (`docs/google-auth-setup.md`), then:

```bash
npm run dev
```

Open **http://localhost:3000**. Dev-only email login is available automatically in `npm run dev`; see `docs/local-dev.md`.

Optional dev helpers:

```bash
npm run seed:dev    # Seed test users
npm run reset:dev   # Reset dev environment
```

### Deploy to Cloudflare

```bash
npm run cf:build     # Build for Workers
npm run cf:preview   # Local Workers preview
npm run cf:deploy    # Build + deploy
```

See `docs/cloudflare-deploy.md` before deploying.

---

## Documentation

| Doc | Topic |
|-----|-------|
| `docs/local-dev.md` | Local URLs, Google sign-in, env files |
| `docs/google-auth-setup.md` | Google OAuth configuration |
| `docs/cloudflare-deploy.md` | Cloudflare Workers / OpenNext deploy |
| `docs/auth-troubleshooting.md` | OAuth redirect and login issues |
| `docs/appflow.md` | UI flow and page behavior |
| `supabase/README.md` | Database setup and migrations |
