-- Run in Supabase SQL Editor: bucket + RLS for PDF entry uploads.
-- After this, also run migrations/0007_fix_entry_submit_rls.sql if you have not applied it.

insert into storage.buckets (id, name, public)
values ('entry-pdfs', 'entry-pdfs', false)
on conflict (id) do nothing;

create or replace function public.can_submit_entry_to_yearbook(target_yearbook_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.yearbooks
    where id = target_yearbook_id
      and (
        share_mode = 'link'
        or exists (
          select 1
          from public.yearbook_invites
          where yearbook_id = target_yearbook_id
            and invited_user_id = auth.uid()
        )
      )
  );
$$;

grant execute on function public.can_submit_entry_to_yearbook(uuid) to authenticated;

drop policy if exists "Authenticated users can insert if they have yearbook access" on public.entries;
create policy "Authenticated users can insert if they have yearbook access"
  on public.entries for insert to authenticated
  with check (
    auth.uid() = author_id
    and public.can_submit_entry_to_yearbook(yearbook_id)
  );

drop policy if exists "Authenticated users can upload entry pdfs" on storage.objects;
create policy "Authenticated users can upload entry pdfs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'entry-pdfs'
    and auth.uid() is not null
    and public.can_submit_entry_to_yearbook(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Authors can update own entry pdfs" on storage.objects;
create policy "Authors can update own entry pdfs"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'entry-pdfs'
    and (owner = auth.uid() or owner is null)
  )
  with check (
    bucket_id = 'entry-pdfs'
    and auth.uid() is not null
    and public.can_submit_entry_to_yearbook(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Authors can delete entries they wrote" on public.entries;
create policy "Authors can delete entries they wrote"
  on public.entries for delete to authenticated
  using (auth.uid() = author_id);

drop policy if exists "Authors can update own entry page assets" on public.entries;
create policy "Authors can update own entry page assets"
  on public.entries for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own entry pdfs" on storage.objects;
create policy "Authors can delete own entry pdfs"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'entry-pdfs'
    and (owner = auth.uid() or owner is null)
  );

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
