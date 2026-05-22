# Banners & notification flares

Unified notification system: one fixed top-of-viewport banner for success, error, and info messages app-wide.

---

## Current system (unified)

| Piece | File | Role |
|-------|------|------|
| **`NotificationBanner`** | `src/components/ui/notification-banner.tsx` | Fixed top with margin; rounded-2xl card (legacy FlashBanner look); dismiss × |
| **`NotificationProvider`** | `src/components/providers/notification-provider.tsx` | Context + URL sync + render |
| **`AppProviders`** | `src/components/providers/app-providers.tsx` | Wraps app in root layout (`Suspense`) |
| **`useNotification()`** | same provider | `notify`, `notifyError`, `notifySuccess`, `notifyInfo`, `dismiss` |
| **URL parsing** | `src/lib/notifications/types.ts` | Maps query params → message + tone |

### Behavior

- Banner is **fixed near the top** (`pt-4` / `pt-5`, horizontal inset), centered card — same soft Tailwind palette as the old `FlashBanner` (`rounded-2xl`, `bg-*-50`, colored borders), not a full-width popup bar.
- User dismisses with **×**; URL notification params are stripped via `router.replace` (no full reload).
- **No auto-dismiss** (replaces old 4s canvas toast).
- Client code calls `useNotification()`; server actions redirect with query params. Raw Supabase/Postgres errors are mapped to friendly copy via `src/lib/errors/friendly-message.ts` (e.g. duplicate invite → “That person is already invited…”).

### URL query params (server redirects)

| Param | Tone | Example message |
|-------|------|-----------------|
| `auth_error` | error | Login/signup failures |
| `auth_message` | success | Check your email to confirm… |
| `signed` | success | You've signed the yearbook! |
| `dashboard_error` | error | Share/invite failures on dashboard |
| `profile_error` | error | Profile update failures |
| `profile_message` | success | Username updated. |
| `entry_error` | error | Canvas submit failures |

### Client-only notifications (`useNotification`)

| Source | Examples |
|--------|----------|
| Canvas editor | Draft saved/restored, preview before sign, submit catch |
| Google sign-in button | OAuth errors |
| Auth form | Supabase not configured (info) |
| Share controls | Link copied! |
| PDF export | PDF downloaded. / export failure |

### Removed (cleanup)

- `FlashBanner` component (deleted)
- Per-page `FlashBanner` on dashboard, write hub, profile
- `AuthForm` inline red/green/amber boxes
- Canvas dark `toastMessage` bar
- `submitError` prop on `CanvasEntryEditor` (`entry_error` via URL only)
- Orphan `dashboard?signed=1` page banners (submit → `/write?signed=1`)
- Share inline “Link copied!” text

### Not notifications (unchanged)

- Draft resume **amber banner** on canvas (action UI, not success/error)
- Confirm **dialogs** (preview / sign / reset)
- Static page cards (yearbook unavailable, setup needed, already signed view)
- Write hub **status badges** (Signed / In progress / Not started)
- Flipbook empty states

---

## Message inventory (by flow)

### Login & account (`/login`)

Server: `src/app/auth/actions.ts` → `auth_error` / `auth_message`  
OAuth: `src/app/auth/callback/route.ts` → `auth_error`  
Client: Google button errors; auth form info if env missing.

### Sign yearbooks (`/write`)

Success: `?signed=1` after `submitCanvasEntry`.

### Write / preview / submit (`/write/[username]`)

Server: `entry_error` via `writeErrorUrl()` in `src/app/yearbook/[yearbookId]/write/actions.ts`  
Client: draft, preview gate, submit catch (see canvas editor).

### My yearbook (`/dashboard`)

Server: `dashboard_error` from `src/app/dashboard/actions.ts` (share/invite).

### Profile (`/profile/[username]`)

Server: `profile_error` / `profile_message` from `src/app/profile/actions.ts`  
Share errors use `profile_error` when `returnPath` is profile.

### PDF export

Client success/error on dashboard export button.

---

## File index

| File | Role |
|------|------|
| `src/app/layout.tsx` | `AppProviders` |
| `src/lib/notifications/types.ts` | URL param parsing |
| `src/components/ui/notification-banner.tsx` | Banner UI |
| `src/components/providers/notification-provider.tsx` | Provider + hook |
| `src/app/yearbook/[yearbookId]/write/actions.ts` | `entry_error`, `signed` redirect |
| `src/app/auth/actions.ts` | `auth_error`, `auth_message` |
| `src/app/dashboard/actions.ts` | `dashboard_error` / `profile_error` |
| `src/app/profile/actions.ts` | `profile_error`, `profile_message` |
| `src/components/forms/canvas-entry-editor.tsx` | Client notifies |
| `src/components/forms/auth-form.tsx` | Client info notify |
| `src/components/forms/google-sign-in-button.tsx` | Client error notify |
| `src/components/yearbook/share-controls.tsx` | Copy success notify |
| `src/components/yearbook/pdf-export-button.tsx` | Export notify |
