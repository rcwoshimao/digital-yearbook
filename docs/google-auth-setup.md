# Google sign-in setup

Production login is **Google only**. Email/password is hidden unless `NEXT_PUBLIC_DEV_EMAIL_AUTH=true`.

Project ref: **rdvrzqgbgbkgivdbyetx**

## 1. Google Cloud — OAuth client

1. [Credentials](https://console.cloud.google.com/apis/credentials) → **OAuth 2.0 Client ID** → type **Web application**.
2. **Authorized JavaScript origins**
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
3. **Authorized redirect URIs** (copy exactly — this is the #1 cause of exchange errors):

```text
https://rdvrzqgbgbkgivdbyetx.supabase.co/auth/v1/callback
```

Do **not** put `http://localhost:3000/auth/callback` here. That URL belongs in Supabase only.

4. [OAuth consent screen](https://console.cloud.google.com/auth/branding): set app name (e.g. “Digital Yearbook”) and add your Gmail under **Test users** while in Testing mode.

## 2. Supabase Dashboard

**Authentication → Providers → Google**

- Enable Google
- Paste the **same** Client ID and Client Secret from step 1

**Authentication → URL configuration**

- **Site URL:** `http://localhost:3000`
- **Redirect URLs** (add both):

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

## 3. Environment variables

Use `.env.local` (Next.js loads this automatically):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rdvrzqgbgbkgivdbyetx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart `npm run dev` after changing env files.

Optional dev email login:

```bash
NEXT_PUBLIC_DEV_EMAIL_AUTH=true
```

## 4. If you see “Unable to exchange external code”

1. Re-copy Client ID + Secret into Supabase (regenerate secret in Google if unsure).
2. Confirm Google redirect URI is exactly `https://rdvrzqgbgbkgivdbyetx.supabase.co/auth/v1/callback`.
3. Confirm `http://localhost:3000/auth/callback` is in Supabase **Redirect URLs**.
4. Add yourself as a **Test user** on the Google consent screen.
5. Try once in a fresh tab (don’t refresh `/auth/callback`).

Check **Supabase → Authentication → Logs** for the underlying Google error (`redirect_uri_mismatch`, `invalid_client`, etc.).

## 5. Why Google shows `*.supabase.co`

Normal for Supabase Auth. Customize the consent screen **Branding** so your app name appears at the top.

## 6. Local dev test accounts (optional)

With `NEXT_PUBLIC_DEV_EMAIL_AUTH=true`: `npm run seed:dev`, then **Email & password (local dev)** on `/login`.
