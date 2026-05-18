# Auth troubleshooting

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
