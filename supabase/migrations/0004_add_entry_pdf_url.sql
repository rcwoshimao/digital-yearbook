alter table entries add column if not exists pdf_url text;

alter table entries alter column content_text drop not null;

create or replace function public.prevent_entry_content_updates()
returns trigger
language plpgsql
as $$
begin
  if new.yearbook_id is distinct from old.yearbook_id
    or new.author_id is distinct from old.author_id
    or new.author_name is distinct from old.author_name
    or new.author_university is distinct from old.author_university
    or new.author_class is distinct from old.author_class
    or new.content_text is distinct from old.content_text
    or new.image_urls is distinct from old.image_urls
    or new.pdf_url is distinct from old.pdf_url
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Yearbook entries are immutable after creation.';
  end if;

  return new;
end;
$$;

insert into storage.buckets (id, name, public)
values ('entry-pdfs', 'entry-pdfs', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload entry pdfs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'entry-pdfs'
    and owner = auth.uid()
    and exists (
      select 1 from yearbooks
      where id = ((storage.foldername(name))[1])::uuid
      and (
        share_mode = 'link'
        or exists (
          select 1 from yearbook_invites
          where yearbook_id = yearbooks.id and invited_user_id = auth.uid()
        )
      )
    )
  );

create policy "Authorized users can read entry pdfs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'entry-pdfs'
    and exists (
      select 1
      from entries
      join yearbooks on yearbooks.id = entries.yearbook_id
      where entries.pdf_url = name
        and (entries.author_id = auth.uid() or yearbooks.owner_id = auth.uid())
    )
  );
