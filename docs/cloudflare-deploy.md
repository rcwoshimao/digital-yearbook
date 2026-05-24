# Deploy to Cloudflare Workers (OpenNext)

This branch uses **Next.js 15** and **@opennextjs/cloudflare**. Do not use output directory `dist` or `.next` for deploy.

## Prerequisites

- Supabase env vars configured (see `docs/final-deployment.md`)
- **Node 22** on Cloudflare (required by Wrangler 4.86+)

## Fix: “Wrangler requires at least Node.js v22” / Node 20.20.2 in logs

Cloudflare is building with **Node 20**. Wrangler **requires Node 22**.

**Do all of these:**

1. Repo root has **`.nvmrc`** and **`.node-version`** set to `22` (committed on `next-15`).
2. Dashboard → Worker → **Settings** → **Build** → **Build variables and secrets**:
   - Add or update **`NODE_VERSION`** = **`22`**
   - Remove any `NODE_VERSION=20` if present.
3. **Save**, then **Retry deployment** or push a new commit.

If logs still show `nodejs@20.x`, the dashboard override is winning — fix step 2.

## Fix: deploy runs but nothing was built

If logs go straight from `npm install` to `npx wrangler versions upload` **without** `opennextjs-cloudflare build`, your **build command is missing**.

### Production branch (`main`, etc.)

| Setting | Value |
|---------|--------|
| **Build command** | `npm run cf:build` |
| **Deploy command** | `npm run cf:deploy` |
| **Node** | **22** (`NODE_VERSION=22`) |

Or use a single deploy command (build + deploy):

| Deploy command | `npm run cf:deploy` |
| Build command | *(leave empty)* |

### Preview / non-production branches (`next-15`, `dev`, …)

Cloudflare defaults preview deploy to `npx wrangler versions upload` **only** — that fails without a prior OpenNext build.

| Setting | Value |
|---------|--------|
| **Build command** | `npm run cf:build` |
| **Non-production deploy command** | `npx wrangler versions upload` |

Or one command that does both:

| **Non-production deploy command** | `npm run cf:upload` |
| Build command | *(leave empty)* |

## Local commands

```bash
npm install
npm run build          # Next.js only (sanity check)
npm run cf:build       # Produces .open-next/ for Workers
npm run cf:preview     # Local Workers preview
npm run cf:deploy      # Build + deploy (production)
npm run cf:upload      # Build + upload preview version
```

## Environment variables (Production + Build)

Set under **Settings → Build → Build variables and secrets** (so they exist **during** `cf:build`):

| Variable | Required |
|----------|----------|
| `NODE_VERSION` | **`22`** |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes — `https://digital-yearbook.<account>.workers.dev` (not localhost) |

Optional preview-only:

- `NEXT_PUBLIC_DEV_FEATURES=true`

After changing **`NEXT_PUBLIC_*`**, **redeploy** (inlined at build time).

## Live URL

**Workers & Pages** → `digital-yearbook` →

`https://digital-yearbook.<your-subdomain>.workers.dev`

Supabase redirect: `https://.../auth/callback`

## Repo files for Cloudflare

- `wrangler.jsonc` — Worker config, `nodejs_compat`
- `open-next.config.ts` — OpenNext config
- `.nvmrc` / `.node-version` — pin Node 22
- `public/_headers` — static asset caching
