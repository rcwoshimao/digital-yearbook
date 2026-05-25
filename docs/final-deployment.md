# Production deployment checklist

Use this as the master checklist before going live. The app is **Next.js 14 (App Router)** with **Supabase** (auth, Postgres, storage) and is intended to run on **Cloudflare Pages** (or Cloudflare Workers via the OpenNext adapter).

A shorter older guide lives in `docs/DEPLOYMENT.md`; treat **this file** as the source of truth.

---

## Architecture (what you are deploying)

| Piece | Service | Notes |
|-------|---------|--------|
| Web app | Cloudflare Pages / Workers | SSR, Server Actions, middleware, API routes |
| Auth | Supabase Auth (Google OAuth) | Callback at `/auth/callback` |
| Database | Supabase Postgres | RLS enforced; run all migrations |
| File storage | Supabase Storage | Private buckets `entry-images`, `entry-pdfs` |
| Sign-in | Google Cloud OAuth client | Redirect URI always points at **Supabase**, not your app |

**Important:** This app is **not** a static export. It uses Server Actions (`"use server"`), dynamic routes, and middleware. You cannot deploy with `next build` and output directory `.next` alone — you need the **Cloudflare adapter** (see [§4](#4-cloudflare--nextjs-adapter-required-in-repo)).

---

## 0. Pre-flight (local)

Complete these before touching production:

- [x] App runs locally: `npm install` → `npm run dev`
- [x] Google sign-in works on `http://localhost:3000` (see `docs/google-auth-setup.md`)
- [x] You can sign a canvas page and see it in the yearbook flipbook
- [x] Dashboard PDF export works (or you know which case still fails)
- [x] `npm run build` succeeds locally (catches TypeScript/Next errors early)
- [ ] `npm run lint` passes (optional but recommended)

---

## 1. Supabase production project

You can reuse your dev project or create a **separate production** project (recommended for a real launch).

### 1.1 Create / choose project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (or select existing).
2. Save **Project URL**, **anon key**, and **service role key** (Settings → API).  
   - The **anon** key is safe in the browser bundle.  
   - **Service role** bypasses RLS — only use in local scripts (`npm run seed:dev`), **not** in Cloudflare env vars unless you add server-only admin features.

### 1.2 Apply database migrations (in order)

In **SQL Editor**, run each file under `supabase/migrations/` **in numeric order**:

1. `0001_initial_schema.sql`
2. `0002_add_profile_usernames.sql`
3. `0003_add_entry_style_config.sql`
4. `0004_add_entry_pdf_url.sql`
5. `0005_fix_auth_user_tokens.sql`
6. `0006_add_profile_email_and_login.sql`
7. `0007_fix_entry_submit_rls.sql`
8. `0008_add_entry_page_image_url.sql`
9. `0009_drop_profile_avatar_url.sql`
10. `0010_auth_pending_email_helper.sql`

Then run **`supabase/setup_entry_pdfs_bucket.sql`** if `entry-pdfs` bucket policies are missing (upload/sign flow depends on this).

Verify in the dashboard:

- [ ] Tables: `profiles`, `yearbooks`, `yearbook_invites`, `entries`
- [ ] RLS enabled on user-facing tables
- [ ] Storage buckets: **`entry-images`** (private), **`entry-pdfs`** (private)

See `supabase/README.md` for the privacy model (entries are immutable; owners can hide, not edit content).

### 1.3 Supabase Auth — Google provider

Follow `docs/google-auth-setup.md`, but use **production URLs**:

**Authentication → Providers → Google**

- [ ] Enable Google
- [ ] Paste OAuth **Client ID** and **Client Secret** from Google Cloud (step 2 below)

**Authentication → URL configuration**

- [ ] **Site URL:** your production origin, e.g. `https://yearbook.yourdomain.com` (no trailing slash)
- [ ] **Redirect URLs** — add every origin users will hit:

```text
https://<your-production-domain>/auth/callback
https://<your-project>.pages.dev/auth/callback
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

The app exchanges the OAuth code at `/auth/callback` (`src/app/auth/callback/route.ts`). Google itself redirects to **Supabase**, not this path.

### 1.4 Storage CORS (PDF export & canvas)

Client-side PDF export fetches signed storage URLs (`src/lib/yearbook/pdf-export.ts` with `useCORS: true`). If images are missing from exported PDFs:

**Storage → Configuration → CORS** — allow your app origins:

```json
[
  {
    "origin": "https://<your-production-domain>",
    "methods": ["GET"],
    "headers": ["authorization", "x-client-info", "apikey", "content-type"],
    "maxAgeSeconds": 3600
  },
  {
    "origin": "http://localhost:3000",
    "methods": ["GET"],
    "headers": ["authorization", "x-client-info", "apikey", "content-type"],
    "maxAgeSeconds": 3600
  }
]
```

Add `https://<project>.pages.dev` if you test on the default Pages hostname before a custom domain.

### 1.5 Plan & limits

- [ ] **Free tier** is fine for a small graduation cohort; watch **storage** (JPEG page images up to 10 MB each in `submitCanvasEntry`).
- [ ] For a large school-wide launch, consider **Pro** (higher DB/storage limits, better support).
- [ ] Enable **daily backups** (Pro) or export schema periodically.

### 1.6 Email templates (optional)

If you ever enable email/password or magic links in production, customize **Authentication → Email Templates**. Production login today is **Google-only** unless you explicitly enable dev email auth (see §6).

---

## 2. Google Cloud Console (OAuth)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials** → OAuth 2.0 Client ID (**Web application**).

**Authorized JavaScript origins** (add all environments):

```text
http://localhost:3000
http://127.0.0.1:3000
https://<your-production-domain>
https://<your-project>.pages.dev
```

**Authorized redirect URIs** — only Supabase (do **not** put `/auth/callback` here):

```text
https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
```

2. **OAuth consent screen**
   - [ ] App name and branding set (users see this during Google sign-in)
   - [ ] Move from **Testing** → **Production** when ready for users outside your test-user list
   - [ ] Add support email and privacy policy URL if Google requires verification

3. Re-copy Client ID + Secret into Supabase if you rotate credentials.

---

## 3. GitHub (source for Cloudflare)

- [ ] Push the repo to GitHub (or GitLab — Cloudflare supports both).
- [ ] Default branch is the one you want for production deploys (usually `main`).
- [ ] No secrets in the repo (`.env.local` is gitignored; keep it that way).
- [ ] Consider **branch previews**: Cloudflare can build preview deployments per PR (use separate Supabase redirect URLs or a staging Supabase project).

---

## 4. Cloudflare — Next.js adapter (required in repo)

The repo **does not yet** include a Cloudflare build adapter. `package.json` only has `next build`; Cloudflare cannot run `.next` output directly.

**Recommended (2025+):** [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`).

**Legacy (deprecated):** `@cloudflare/next-on-pages` — still documented in places, but Cloudflare no longer maintains it.

### 4.1 Tasks to implement in the codebase

- [ ] Add and configure `@opennextjs/cloudflare` (or your chosen adapter) per official docs
- [ ] Add `wrangler.toml` (or `wrangler.jsonc`) with `nodejs_compat` compatibility flag
- [ ] Update `package.json` scripts, e.g. production build command the adapter documents (often wraps `next build`)
- [ ] Set Cloudflare **build output directory** to what the adapter specifies (e.g. `.open-next` or `.vercel/output/static` for older tooling — **not** `.next`)
- [ ] Confirm **Server Actions**, **middleware** (`middleware.ts`), and **dynamic routes** work on a preview deploy
- [ ] Run `npm run build` locally with the new pipeline before connecting Git

### 4.2 Cloudflare account

- [ ] Sign up / log in at [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Add your domain to Cloudflare (if using a custom domain) — update registrar nameservers to Cloudflare

---

## 5. Cloudflare Pages project

**Workers & Pages → Create → Pages → Connect to Git**

### 5.1 Build settings

| Setting | Value |
|---------|--------|
| Framework preset | Next.js (or None if preset conflicts) |
| Build command | Adapter’s command (e.g. `npx opennextjs-cloudflare build` — use whatever you configure in §4) |
| Build output directory | From adapter docs ( **not** `.next` ) |
| Root directory | `/` (repo root) |
| Node version | **20** or **22** (Environment variable `NODE_VERSION` if the UI offers it) |

### 5.2 Compatibility flags (critical)

**Settings → Functions → Compatibility flags** (production **and** preview):

- [ ] Enable **`nodejs_compat`**
- [ ] Compatibility date ≥ **2024-09-23** (or latest stable your adapter recommends)

Without `nodejs_compat`, Server Actions and Node APIs often fail at runtime.

### 5.3 Environment variables

Set in **Pages → Settings → Environment variables** for **Production** (and **Preview** if you use PR previews):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical site URL, e.g. `https://yearbook.yourdomain.com` — used in server redirects and email redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-side sign/delete/upload; avoids JWT cookie issues on mobile and Cloudflare |
| `NEXT_PUBLIC_DEV_FEATURES` | **Must be unset** on production | Enables dev UI on preview/staging deploys only |
| `NEXT_PUBLIC_DEV_EMAIL_AUTH` | **Must be unset** on production | Legacy alias for `NEXT_PUBLIC_DEV_FEATURES` |

Also used locally by `scripts/seed-dev-users.mjs`. Without it on Workers, signing may fail with session/JWS errors after large uploads.

After changing env vars, **redeploy** — `NEXT_PUBLIC_*` values are inlined at build time.

### 5.4 First deploy

- [ ] Trigger deploy; fix build errors from the adapter log
- [ ] Open `https://<project>.pages.dev` and run the [post-deploy checklist](#8-post-deploy-verification)

### 5.5 Custom domain

**Pages → Custom domains**

- [ ] Add `yearbook.yourdomain.com` (or apex/www per your DNS plan)
- [ ] Confirm SSL certificate is **Active**
- [ ] Update Supabase **Site URL** and **Redirect URLs** to the custom domain
- [ ] Update Google **Authorized JavaScript origins**
- [ ] Set `NEXT_PUBLIC_APP_URL` to the custom domain and redeploy

---

## 6. Production security hardening

### 6.1 Auth & dev features

Dev-only UI is controlled by `src/lib/auth/dev.ts` (`isDevFeaturesEnabled`). It turns on when `NODE_ENV=development` (local `npm run dev`) or when you set `NEXT_PUBLIC_DEV_FEATURES=true` (or legacy `NEXT_PUBLIC_DEV_EMAIL_AUTH=true`).

| Deploy target | Env vars | What users see |
|---------------|----------|----------------|
| **Production** (`main`) | none | Google login only; no “Preview dashboard”; no email/password |
| **Preview** (`dev` branch) | `NEXT_PUBLIC_DEV_FEATURES=true` | Same dev tools as local (email login, preview link, seed hints) |
| **Local** | optional — auto-on in `npm run dev` | Full dev toolkit without extra env |

- [ ] Production Cloudflare env: **do not** set `NEXT_PUBLIC_DEV_FEATURES` or `NEXT_PUBLIC_DEV_EMAIL_AUTH`
- [ ] Cloudflare **preview** env (branch `dev`): set `NEXT_PUBLIC_DEV_FEATURES=true` if you want dev login on preview URLs
- [ ] **Do not** run `npm run seed:dev` against production Supabase

### 6.2 Cloudflare WAF / rate limiting (optional)

The write flow uses **Server Actions**, not `POST /api/entries` (that route still returns `501`). Rate limiting the API alone does not protect submissions today.

When you implement real API handlers or expose public POST endpoints:

- **Security → WAF → Rate limiting rules**
- Example (from `docs/DEPLOYMENT.md`): `POST` `/api/entries`, ~20 req/min per IP

You can also add **Bot Fight Mode** / **Super Bot Fight Mode** if you see abuse.

### 6.3 Supabase dashboard

- [ ] Rotate keys if they were ever committed or shared
- [ ] Restrict team access to the Supabase project
- [ ] Review **Authentication → Logs** after launch for failed sign-ins

### 6.4 Headers (optional)

In Cloudflare **Rules** or adapter config, consider:

- `Strict-Transport-Security`
- `X-Frame-Options: DENY` (unless you need embeds)
- Content Security Policy (tune for Google Fonts + Supabase domains)

---

## 7. Environment variable reference

Create `.env.local` locally (not committed). Mirror the same keys in Cloudflare for production.

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://yearbook.yourdomain.com

# Local dev only — optional; npm run dev enables dev features automatically
# NEXT_PUBLIC_DEV_FEATURES=true
# NEXT_PUBLIC_DEV_EMAIL_AUTH=true  # legacy alias

# Local scripts only (seed:dev) — omit from Cloudflare unless needed
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Restart `npm run dev` after changing `.env.local`.

---

## 8. Post-deploy verification

Run through on the **production URL** (incognito window):

### Auth

- [ ] `/login` → **Continue with Google** → lands on `/dashboard`
- [ ] Sign out works
- [ ] Session persists after refresh (middleware + cookies)

### Core flows

- [ ] Dashboard loads yearbook and share controls
- [ ] Open a friend’s write link `/write/<username>` → canvas editor loads
- [ ] Sign a page → success banner → entry appears for owner
- [ ] Flipbook shows signed JPEG page
- [ ] **Export PDF** on dashboard includes images (if CORS is correct)

### Storage

- [ ] Supabase **Storage → entry-pdfs** shows `{yearbookId}/{userId}.jpg` after sign
- [ ] Signed URLs work for owner (not publicly listable)

### Errors to watch

| Symptom | Likely fix |
|---------|------------|
| Redirect loop / instant logout | Supabase redirect URL mismatch; check Site URL |
| “Unable to exchange external code” | Google redirect URI must be `*.supabase.co/auth/v1/callback`; secrets match Supabase |
| “Storage bucket entry-pdfs is missing” | Run `supabase/setup_entry_pdfs_bucket.sql` |
| PDF export missing images | Storage CORS (§1.4) |
| Build fails on Cloudflare | Adapter not configured (§4); wrong output directory |
| Server Action 500 / Node errors | Enable `nodejs_compat` (§5.2) |

See also `docs/check-pdf.md` for page image debugging.

---

## 9. Legal & content (launch hygiene)

- [ ] **Sticker licenses:** Flaticon attribution is documented in `docs/Sticker attributions.md` — ensure production UI still shows credits where required by your Flaticon license
- [ ] **Privacy policy** and **terms** pages (linked from OAuth consent screen if needed)
- [ ] **Google OAuth verification** if you exceed test-user limits

---

## 10. Optional / later improvements

Not blocking launch, but tracked in the codebase:

| Item | Status |
|------|--------|
| Implement `src/app/api/*` routes (currently `501`) | Placeholder |
| Cloudflare rate limit on `POST /api/entries` | Waiting on API |
| Separate **staging** Supabase + Cloudflare preview env | Recommended for teams |
| Error monitoring (Sentry, Cloudflare Logpush) | Not set up |
| Analytics | Not set up |
| `README.md` still describes “placeholder shell” | Update after launch |

---

## 11. Quick reference links

| Resource | URL |
|----------|-----|
| Supabase dashboard | https://supabase.com/dashboard |
| Google credentials | https://console.cloud.google.com/apis/credentials |
| Cloudflare dashboard | https://dash.cloudflare.com |
| Google auth setup (this repo) | `docs/google-auth-setup.md` |
| PDF / page image checks | `docs/check-pdf.md` |
| OpenNext on Cloudflare | https://opennext.js.org/cloudflare |

---

## Suggested order of work

1. Finish local testing (§0)  
2. Production Supabase + migrations + Google auth (§1–2)  
3. Add Cloudflare adapter to the repo and verify build (§4)  
4. Connect GitHub → Cloudflare Pages + env vars (§5)  
5. Custom domain + update all redirect/CORS URLs (§5.5, §1.3, §1.4, §2)  
6. Security pass (§6)  
7. Post-deploy checklist (§8)  

When §4 is done in the repo, update the **Build command** and **output directory** rows in §5.1 to match your actual `package.json` scripts.
