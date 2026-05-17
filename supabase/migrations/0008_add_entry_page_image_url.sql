alter table entries add column if not exists page_image_url text;

drop policy if exists "Authorized users can read entry pdfs" on storage.objects;
create policy "Authorized users can read entry pdfs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'entry-pdfs'
    and exists (
      select 1
      from entries
      join yearbooks on yearbooks.id = entries.yearbook_id
      where (entries.pdf_url = name or entries.page_image_url = name)
        and (entries.author_id = auth.uid() or yearbooks.owner_id = auth.uid())
    )
  );
