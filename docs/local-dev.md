# Local development (localhost:3000)

## Run the app locally

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Do not use the Cloudflare Workers URL for testing code changes — that site only updates after you deploy.

## How URLs are chosen

| When | App URL used for share links & emails |
|------|----------------------------------------|
| `npm run dev` | Always **http://localhost:3000** (via `.env.development` and `getAppUrl()`) |
| `npm run build` / deploy | `NEXT_PUBLIC_APP_URL` from Cloudflare env or build-time env |

Files:

- **`.env.development`** — committed; sets `NEXT_PUBLIC_APP_URL=http://localhost:3000` for dev
- **`.env.local`** — your machine; can override secrets (gitignored)
- **`.env`** — shared defaults; production URL is commented out so it does not override dev

## Google sign-in locally

Supabase **Authentication → URL configuration → Redirect URLs** must include:

```text
http://localhost:3000/**
http://127.0.0.1:3000/**
```

Also add your Workers URL if you use production (`https://digital-yearbook....workers.dev/**`).

**Site URL** can remain your production URL. If login still jumps to Workers, localhost is missing from **Redirect URLs**.

Always open **http://localhost:3000/login** — not the `192.168.x.x` link from the terminal (the app redirects that to localhost in dev, but Supabase must allow localhost).

Google Cloud **Authorized JavaScript origins**: `http://localhost:3000` and `http://127.0.0.1:3000`.  
Google **redirect URI** stays `https://rdvrzqgbgbkgivdbyetx.supabase.co/auth/v1/callback` only.

## See handwriting / other local-only features

1. `npm run dev`
2. Go to **http://localhost:3000/write** → **Start** on a yearbook
3. URL should be `http://localhost:3000/write/{username}`
4. Hard refresh if the UI looks stale (`Cmd+Shift+R`)

A green banner at the top confirms you are on local dev.
