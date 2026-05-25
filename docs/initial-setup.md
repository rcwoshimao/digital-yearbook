# Cursor Prompt: Digital Graduation Yearbook App

## Project Overview

Build a full-stack web application for a digital graduation yearbook. Users sign in to write entries in each other's yearbooks. Entries are permanent (no edits), contain rich content (text + images), and the yearbook can be shared publicly via link or privately via user ID invite. The UI presents entries in a flipbook-style viewer with search and PDF export.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR for SEO, easy API routes, great DX |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent UI |
| Auth | Supabase Auth (email/password + OAuth) | Integrated with DB, handles JWTs |
| Database | Supabase (Postgres) | Row-Level Security for privacy, realtime capable |
| File Storage | Supabase Storage | Image uploads per entry, bucket policies |
| Hosting | Cloudflare Pages | Free CDN, DDoS protection, edge caching |
| PDF Export | `react-pdf` or `jspdf` + `html2canvas` | Client-side PDF generation from rendered entries |

---

## Data Model (Supabase / Postgres)

### `profiles` table
Extends Supabase's built-in `auth.users`.

```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  university text,
  graduation_class text,        -- e.g. "Class of 2025"
  created_at timestamptz default now()
);
```

### `yearbooks` table
Every user automatically gets one yearbook upon signup.

```sql
create table yearbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  share_mode text check (share_mode in ('link', 'invite_only')) default 'invite_only',
  created_at timestamptz default now()
);
```

### `yearbook_invites` table
For invite-only mode: the owner can add specific user IDs.

```sql
create table yearbook_invites (
  id uuid primary key default gen_random_uuid(),
  yearbook_id uuid references yearbooks(id) on delete cascade not null,
  invited_user_id uuid references profiles(id) on delete cascade not null,
  invited_at timestamptz default now(),
  unique (yearbook_id, invited_user_id)
);
```

### `entries` table
An entry is written BY one user IN another user's yearbook.

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  yearbook_id uuid references yearbooks(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,           -- snapshot at write time
  author_university text,              -- snapshot
  author_class text,                   -- snapshot
  content_text text,
  image_urls text[],                   -- array of Supabase Storage URLs
  created_at timestamptz default now(),
  -- NO updated_at intentionally — entries are immutable
  is_visible_to_owner boolean default true  -- owner can hide but not edit
);
```

> **Immutability**: Do NOT expose any UPDATE route for `content_text` or `image_urls` on entries. Enforce this at the RLS level (see below) and in your API layer. Once inserted, content is locked.

---

## Row-Level Security (RLS) Policies

Enable RLS on all tables. This is how you protect user privacy — **Supabase enforces these at the database level**, so even if your API has a bug, the DB won't leak data.

```sql
-- PROFILES: anyone authenticated can read; only self can update
alter table profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- YEARBOOKS: owner always sees their own; a user can "access" a yearbook to write in it
-- (via link or invite), but that does NOT grant them read access to the full yearbook.
-- The yearbook record itself is fetched only by the owner for their dashboard.
-- Writers follow the share link to the write form — they don't need to "view" the yearbook.
alter table yearbooks enable row level security;

create policy "Owner can view and manage own yearbook"
  on yearbooks for select using (auth.uid() = owner_id);

create policy "Invited users can read yearbook metadata to write an entry"
  on yearbooks for select using (
    exists (
      select 1 from yearbook_invites
      where yearbook_id = yearbooks.id and invited_user_id = auth.uid()
    )
  );

-- Link-share: any authenticated user can read the yearbook record (not entries — those are
-- protected separately) just enough to render the "Write an entry" page
create policy "Link-share yearbooks expose metadata to authenticated writers"
  on yearbooks for select using (share_mode = 'link' and auth.role() = 'authenticated');

-- ENTRIES: strict two-party visibility only.
-- A user can see an entry if and only if:
--   (a) they are the author of that entry, OR
--   (b) they are the owner of the yearbook the entry was written in
-- Nobody else — not other signers, not visitors — can see entries that don't belong to them.
-- If users want to share their entries with others, they export to PDF.
alter table entries enable row level security;

create policy "Authors can see entries they wrote"
  on entries for select using (auth.uid() = author_id);

create policy "Yearbook owners can see entries written to them"
  on entries for select using (
    exists (select 1 from yearbooks where id = entries.yearbook_id and owner_id = auth.uid())
  );

-- INSERT: user must be authenticated, must be the author, and must have access to the yearbook
-- (either share_mode = 'link' or they are explicitly invited)
create policy "Authenticated users can insert if they have yearbook access"
  on entries for insert with check (
    auth.uid() = author_id and
    (
      exists (select 1 from yearbooks where id = yearbook_id and share_mode = 'link')
      or
      exists (select 1 from yearbook_invites where yearbook_id = entries.yearbook_id and invited_user_id = auth.uid())
    )
  );

-- CRITICAL: No UPDATE or DELETE policy on entries — immutability enforced here
```

---

## Supabase Storage

Create a bucket called `entry-images`.

```
Bucket: entry-images
Access: private (signed URLs only — never public URLs)
Policy: authenticated users can upload to path `{yearbook_id}/{entry_id}/{filename}`
        only the file uploader's user ID matches auth.uid()
```

When rendering images in the UI, always use **signed URLs** with short expiry (e.g. 1 hour). This ensures images are only accessible to authorized viewers, not anyone with a raw link.

---

## API Routes (Next.js App Router `/app/api/`)

### Auth (handled by Supabase — minimal custom code needed)
- Supabase handles `/auth/callback`, token refresh, OAuth flows.

### Yearbook
- `GET /api/yearbook/[owner_id]` — fetch yearbook + entries (respects RLS via Supabase client)
- `POST /api/yearbook/share` — toggle share mode between `link` / `invite_only`
- `POST /api/yearbook/invite` — add a user ID to `yearbook_invites`
- `DELETE /api/yearbook/invite/[invited_user_id]` — revoke an invite

### Entries
- `POST /api/entries` — create a new entry (text + image upload to Supabase Storage)
- `GET /api/entries/mine` — list all entries the logged-in user has authored (across all yearbooks)
- `GET /api/entries/[yearbook_id]` — list entries written TO the logged-in user's own yearbook only; returns 403 if the requester is not the owner
- No PUT or PATCH route — entries are immutable

### Search
- `GET /api/search?q=name` — search entries written TO the logged-in user's own yearbook by author name
  - Scoped strictly to the requester's own yearbook — cannot search entries in other people's yearbooks
  - Use Postgres `ilike` or set up a `tsvector` index for better performance

---

## Sharing Flow

### 1. Share by Link
- Generate a unique share URL: `yourapp.com/yearbook/[yearbook_id]`
- If `share_mode = 'link'`, any authenticated user who visits can write an entry
- Show a "Copy Link" button on the yearbook owner's dashboard

### 2. Invite by User ID
- Owner flips yearbook to `invite_only`
- Input field: "Enter User ID to invite"
- Lookup the user via `profiles` table, confirm they exist, then insert into `yearbook_invites`
- Only invited users + owner can view and write entries

---

## Frontend Pages & Components

### Pages
| Route | Description |
|---|---|
| `/` | Landing page with sign-in / sign-up |
| `/dashboard` | Two-panel view: entries received (your yearbook) + entries you've written |
| `/yearbook/[yearbook_id]/write` | Write an entry in someone else's yearbook (no viewing other entries here) |
| `/profile/[user_id]` | Public profile page (name, university, class — no entries visible) |

> **No `/yearbook/[yearbook_id]` public viewer route.** Visitors who follow a share link land directly on the write form. Only the yearbook owner sees their received entries, on their own dashboard. There is no page where a third party can browse a yearbook's contents.

### Key UI Components

**Dashboard** (`/dashboard`)
The dashboard has two panels:
- **"My Yearbook"** — the flipbook of entries other people have written to you (only visible to you)
- **"My Entries"** — a list of all entries you have written to others, so you can remember what you said and where

No user will ever see another user's "My Yearbook" panel. The share link only leads people to the write form.

**Flipbook Viewer** (`YearbookFlipbook`)
- Rendered only on the owner's dashboard within the "My Yearbook" panel — never on a public route
- Use `react-pageflip` library for the page-turn animation
- Each "page" renders one entry: author name, university, class year, timestamp, text, and images
- Navigation: prev/next buttons + keyboard arrow support
- On mobile: swipe gesture support

**Entry Card** (inside each flipbook page)
```
┌─────────────────────────────┐
│  [Author Avatar]            │
│  Name          Class of 20XX│
│  University                 │
│  ─────────────────────────  │
│  [Entry text content here]  │
│                             │
│  [Image if present]         │
│                             │
│  Written on: May 15, 2025   │
└─────────────────────────────┘
```

**Search Bar**
- Appears above the flipbook
- Filters/jumps to entries matching the author name in real time
- Highlight matched entries

**Write Entry Form**
- Rich text area (plain text first; you can add markdown later)
- Image upload (max 5 images, 5MB each — enforce on client + server)
- Author info is auto-filled from the user's profile (read-only display)
- Submit → locked forever

**PDF Export Button**
- Use `html2canvas` to render all entry cards to canvas, then compile into PDF via `jspdf`
- Show a loading spinner (can take a few seconds)
- Export filename: `yearbook-[owner_name]-[year].pdf`

---

## Cloudflare Integration

### Hosting: Cloudflare Pages
- Connect your GitHub repo to Cloudflare Pages
- Set build command: `next build` and output: `.next`
- Add environment variables in Cloudflare dashboard (Supabase URL, anon key)

### Why this handles traffic spikes:
- Cloudflare's CDN caches static assets globally (JS, CSS, fonts)
- Next.js static pages (landing, public yearbooks) are served from edge — near instant
- Only dynamic API routes hit your Supabase instance

### Optional: Cloudflare Rate Limiting
- Add a rate limit rule: max 20 requests/min per IP to `/api/entries` (POST)
- This prevents spam entry flooding
- Set up in Cloudflare Dashboard → Security → WAF → Rate Limiting

---

## Data Safety & Privacy Notes

**Can Supabase handle the data volume?**
- Supabase Free tier: 500MB DB, 1GB storage — fine for a personal yearbook
- Pro tier ($25/mo): 8GB DB, 100GB storage — handles thousands of users comfortably
- Images are the real storage concern; enforce size limits and compress on upload

**Privacy protections built in:**
1. RLS policies are enforced at the Postgres level — no API bug can leak entries to the wrong user
2. Signed URLs for images expire — raw image links can't be shared externally
3. Entries are only ever visible to two parties: the author who wrote it, and the yearbook owner who received it. No one else.
4. There is no public-facing yearbook viewer route — the share link only opens a write form
5. PDF export is the intentional and only sharing mechanism — users choose what to share and with whom

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # only used server-side
NEXT_PUBLIC_APP_URL=https://yourdomain.pages.dev
```

---

## Suggested Build Order for Cursor

1. **Supabase setup** — create tables, RLS policies, storage bucket
2. **Auth flow** — sign up, sign in, profile creation on first login
3. **Dashboard** — show own yearbook, sharing toggle, invite system
4. **Write entry page** — form with image upload, submit locks content
5. **Yearbook viewer** — flipbook component with search
6. **PDF export** — last, after entries render correctly
7. **Deploy to Cloudflare Pages** — connect repo, set env vars, test

---

## Libraries to Install

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-pageflip         # flipbook UI
npm install html2canvas jspdf      # PDF export
npm install react-dropzone         # image upload UX
npm install date-fns               # timestamp formatting
npm install @radix-ui/react-dialog # modals (or use shadcn/ui)
```