-- Allow signers to replace a broken page image (trigger only blocks non-asset columns).

create policy "Authors can update own entry page assets"
  on public.entries for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
