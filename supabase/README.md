# Supabase Setup

Apply `migrations/0001_initial_schema.sql` to a Supabase project before wiring the app to live data.

The migration creates:

- `profiles`, `yearbooks`, `yearbook_invites`, and `entries`
- Row-Level Security policies for the privacy model in `document.md`
- A signup trigger that creates one profile and one yearbook per new auth user
- The private `entry-images` storage bucket
- Storage policies so signed image URLs are readable only by the entry author or yearbook owner

## Important Notes

- Do not add `UPDATE` routes for entry content or images. A database trigger rejects changes to immutable entry fields.
- Owners may update `is_visible_to_owner` to hide received entries without changing the original content.
- The app still needs Supabase project credentials in `.env.local` before auth or data fetching will work.
