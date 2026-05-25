-- Allow signers to remove their own entry (retest after a bad upload, etc.).

create policy "Authors can delete entries they wrote"
  on public.entries for delete
  to authenticated
  using (auth.uid() = author_id);
