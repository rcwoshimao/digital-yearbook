# Auth troubleshooting

## Google login sends me to Workers instead of localhost

This is almost always **Supabase URL configuration**, not the git branch.

**What happens**

1. You start sign-in on `http://localhost:3000` (or a LAN IP like `http://192.168.x.x:3000`).
2. The app asks Supabase to return to `http://localhost:3000/auth/callback`.
3. If that URL is **not** on Supabase’s allow list, Supabase falls back to **Site URL** (often your Workers URL).

**Fix in Supabase Dashboard → Authentication → URL configuration**

1. **Redirect URLs** — add **all** of these (one per line):

```text
http://localhost:3000/**
http://127.0.0.1:3000/**
https://digital-yearbook.rebeccachencjy.workers.dev/**
```

(If wildcards are disabled in your project, use exact paths: `http://localhost:3000/auth/callback`, etc.)

2. **Site URL** — can stay your production Workers URL for deployed users. Local dev still works as long as `localhost` redirect URLs are allowed.

3. Restart `npm run dev` and sign in only from **http://localhost:3000/login** (not the Network IP from the terminal, not Workers).

**App behavior (dev)**

- `npm run dev` forces OAuth `redirectTo` to `http://localhost:3000/auth/callback`.
- Middleware redirects LAN IPs (`192.168.x.x:3000`) to `localhost:3000` in development.

**Google Cloud** — keep redirect URI as `https://rdvrzqgbgbkgivdbyetx.supabase.co/auth/v1/callback` only (see `docs/google-auth-setup.md`).

---

## Cannot log in as `user2` (or username login fails)

**Common causes**

1. `profiles.email` out of sync with `auth.users.email` (often after an email change).
2. `auth.users` token columns are `NULL` → Supabase returns `Database error querying schema`.
3. Missing row in `auth.identities` for email provider.

**Fix (run in Supabase SQL Editor)**

1. Run `supabase/fix_auth_login_and_email.sql` (full repair + diagnostics).
2. In your project terminal: `npm run seed:dev` (resets dev passwords to `------` and verifies login).

**Dev credentials after seed**

| Username | Email | Password |
|----------|-------|----------|
| user1 | rebeccachencjy@gmail.com | `------` |
| user2 | mantoumiaoshen@gmail.com | `------` |

You can sign in with **username** or **email**.

---

## Sign-up confirmation emails not arriving

Emails are sent by **Supabase Auth**, not this app.

**Check in Supabase Dashboard**

1. **Authentication → Providers → Email**
   - For local/dev: consider turning **off** “Confirm email” so new accounts work immediately.
   - For production: configure **Custom SMTP** (Resend, SendGrid, etc.). The built-in mailer is rate-limited and often blocked.
2. **Authentication → URL configuration**
   - Site URL: your app URL (e.g. `http://localhost:3000` or production URL).
   - Redirect URLs: include `http://localhost:3000/auth/callback` and your production callback URL.
3. **Project Settings → Auth → SMTP** — set custom SMTP if confirm-email is required.

**App behavior**

- Sign-up uses `emailRedirectTo` → `/auth/callback?next=/dashboard` after the user clicks the link in email.
- Until email is confirmed, the user cannot sign in if confirmation is required.

**Quick dev workaround**

- Disable “Confirm email” in Supabase, or
- Create users with `npm run seed:dev` (emails pre-confirmed via service role).

---

## Profile table cleanup

Migration `0009_drop_profile_avatar_url.sql` removes unused `avatar_url`.

Columns kept (all used by the app):

- `id`, `display_name`, `username`, `email`, `university`, `graduation_class`, `created_at`
