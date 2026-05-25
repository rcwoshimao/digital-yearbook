-- Run once in Supabase SQL Editor if Remove my signature / re-sign fails.
-- Fixes: authors can delete and update their own page image on entries.

drop policy if exists "Authors can delete entries they wrote" on public.entries;
create policy "Authors can delete entries they wrote"
  on public.entries for delete
  to authenticated
  using (auth.uid() = author_id);

drop policy if exists "Authors can update own entry page assets" on public.entries;
create policy "Authors can update own entry page assets"
  on public.entries for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
