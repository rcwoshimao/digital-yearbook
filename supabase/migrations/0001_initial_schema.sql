create extension if not exists pgcrypto;

create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  username text not null unique,
  university text,
  graduation_class text,
  avatar_url text,
  created_at timestamptz default now()
);

create table yearbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  share_mode text check (share_mode in ('link', 'invite_only')) default 'link',
  created_at timestamptz default now()
);

create table yearbook_invites (
  id uuid primary key default gen_random_uuid(),
  yearbook_id uuid references yearbooks(id) on delete cascade not null,
  invited_user_id uuid references profiles(id) on delete cascade not null,
  invited_at timestamptz default now(),
  unique (yearbook_id, invited_user_id)
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  yearbook_id uuid references yearbooks(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,
  author_university text,
  author_class text,
  content_text text,
  image_urls text[],
  created_at timestamptz default now(),
  is_visible_to_owner boolean default true
);

create index yearbooks_owner_id_idx on yearbooks(owner_id);
create index yearbook_invites_yearbook_id_idx on yearbook_invites(yearbook_id);
create index yearbook_invites_invited_user_id_idx on yearbook_invites(invited_user_id);
create index entries_yearbook_id_idx on entries(yearbook_id);
create index entries_author_id_idx on entries(author_id);
create index entries_author_name_idx on entries(author_name);

alter table profiles enable row level security;
alter table yearbooks enable row level security;
alter table yearbook_invites enable row level security;
alter table entries enable row level security;

create or replace function public.is_yearbook_owner(target_yearbook_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.yearbooks
    where id = target_yearbook_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_invited_to_yearbook(target_yearbook_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.yearbook_invites
    where yearbook_id = target_yearbook_id and invited_user_id = auth.uid()
  );
$$;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Owner can view and manage own yearbook"
  on yearbooks for select using (auth.uid() = owner_id);

create policy "Owner can update own yearbook"
  on yearbooks for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Invited users can read yearbook metadata to write an entry"
  on yearbooks for select using (public.is_invited_to_yearbook(yearbooks.id));

create policy "Link-share yearbooks expose metadata to authenticated writers"
  on yearbooks for select using (share_mode = 'link' and auth.role() = 'authenticated');

create policy "Owners can view invites for own yearbook"
  on yearbook_invites for select using (public.is_yearbook_owner(yearbook_invites.yearbook_id));

create policy "Invited users can view their invite"
  on yearbook_invites for select using (invited_user_id = auth.uid());

create policy "Owners can create invites for own yearbook"
  on yearbook_invites for insert with check (public.is_yearbook_owner(yearbook_invites.yearbook_id));

create policy "Owners can revoke invites for own yearbook"
  on yearbook_invites for delete using (public.is_yearbook_owner(yearbook_invites.yearbook_id));

create policy "Authors can see entries they wrote"
  on entries for select using (auth.uid() = author_id);

create policy "Yearbook owners can see entries written to them"
  on entries for select using (public.is_yearbook_owner(entries.yearbook_id));

create policy "Yearbook owners can hide entries written to them"
  on entries for update using (public.is_yearbook_owner(entries.yearbook_id))
  with check (public.is_yearbook_owner(entries.yearbook_id));

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
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Yearbook entries are immutable after creation.';
  end if;

  return new;
end;
$$;

create trigger entries_prevent_content_updates
  before update on entries
  for each row execute procedure public.prevent_entry_content_updates();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_name text;
  fallback_username text;
begin
  fallback_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    'New Graduate'
  );
  fallback_username := coalesce(
    nullif(regexp_replace(lower(new.raw_user_meta_data ->> 'username'), '[^a-z0-9_]+', '_', 'g'), ''),
    regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]+', '_', 'g') || '_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    fallback_name,
    fallback_username,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.yearbooks (owner_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('entry-images', 'entry-images', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload entry images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'entry-images'
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

create policy "Authorized users can read entry images for signed URLs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'entry-images'
    and exists (
      select 1
      from entries
      join yearbooks on yearbooks.id = entries.yearbook_id
      where entries.yearbook_id = ((storage.foldername(name))[1])::uuid
        and entries.id = ((storage.foldername(name))[2])::uuid
        and (entries.author_id = auth.uid() or yearbooks.owner_id = auth.uid())
    )
  );

create policy "Authenticated users can insert if they have yearbook access"
  on entries for insert with check (
    auth.uid() = author_id and
    (
      exists (select 1 from yearbooks where id = yearbook_id and share_mode = 'link')
      or public.is_invited_to_yearbook(entries.yearbook_id)
    )
  );
