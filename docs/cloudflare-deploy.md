# Deploy to Cloudflare Workers (OpenNext)

This branch uses **Next.js 15** and **@opennextjs/cloudflare**. Do not use output directory `dist` or `.next` for deploy.

## Prerequisites

- Supabase env vars configured (see `docs/final-deployment.md`)
- Node **22** on Cloudflare (Build settings → Environment variables → `NODE_VERSION` = `22`)

## Local commands

```bash
npm install
npm run build          # Next.js only (sanity check)
npm run cf:build       # Produces .open-next/ for Workers
npm run cf:preview     # Local Workers preview
npm run cf:deploy      # Deploy via Wrangler CLI (needs Cloudflare login)
```

## Cloudflare dashboard (Git-connected Worker)

| Setting | Value |
|---------|--------|
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Node version | **22** |

Do **not** set a static “output directory” like `dist` — Wrangler uses `wrangler.jsonc` → `.open-next/worker.js` and `.open-next/assets`.

## Environment variables (Production)

Set in the Worker / Pages project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — your live URL, e.g. `https://digital-yearbook.<account>.workers.dev`

Optional preview-only:

- `NEXT_PUBLIC_DEV_FEATURES=true` — dev login UI on preview deploys only

After changing `NEXT_PUBLIC_*` vars, **redeploy** (they are inlined at build time).

## Live URL

After a successful deploy: **Workers & Pages** → `digital-yearbook` → URL like:

`https://digital-yearbook.<your-subdomain>.workers.dev`

Add that URL to Supabase Auth redirect URLs: `https://.../auth/callback`

## Files added for Cloudflare

- `wrangler.jsonc` — Worker name, `nodejs_compat`, assets binding
- `open-next.config.ts` — OpenNext Cloudflare config
- `public/_headers` — static asset caching
- `.dev.vars` — local only (gitignored); template: `NEXTJS_ENV=development`
