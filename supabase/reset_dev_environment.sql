-- =============================================================================
-- DIGITAL YEARBOOK — FULL DEV RESET (run once in Supabase SQL Editor)
-- =============================================================================
--
-- What this does:
--   1. Fixes schema (pdf_url, profiles.email, triggers, helpers)
--   2. Replaces all PDF storage + entry-submit RLS policies
--   3. Wipes sample user data (entries, yearbooks, profiles, auth, storage PDFs)
--   4. Recreates User 1 / User 2 with empty yearbooks (no entries)
--
-- AFTER this file succeeds, run in your project terminal:
--   npm run seed:dev
--
-- That sets working passwords (------) via the Admin API. SQL passwords alone
-- often fail login on hosted Supabase.
--
-- Test accounts:
--   user1 / rebeccachencjy@gmail.com  |  user2 / mantoumiaoshen@gmail.com
--   password for both: ------
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Sample IDs (stable for local testing)
-- -----------------------------------------------------------------------------
do $reset$
declare
  user1_id uuid := '11111111-1111-4111-8111-111111111111';
  user2_id uuid := '22222222-2222-4222-8222-222222222222';
  yearbook1_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  yearbook2_id uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  auth_instance_id uuid;
begin
  select coalesce(
    (select id from auth.instances limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  into auth_instance_id;

  -- ===========================================================================
  -- A. SCHEMA FIXES (safe to re-run)
  -- ===========================================================================

  alter table public.entries
    add column if not exists pdf_url text;

  alter table public.entries
    alter column content_text drop not null;

  alter table public.entries
    add column if not exists style_config jsonb not null default '{
      "background_color": "#fffdf5",
      "pattern": "none",
      "font": "serif",
      "ink_color": "#1a1a1a",
      "border": "none"
    }'::jsonb;

  alter table public.profiles
    add column if not exists email text;

  create unique index if not exists profiles_username_key on public.profiles (username);
  create unique index if not exists profiles_email_key on public.profiles (lower(email));

  -- Immutability trigger (includes pdf_url + style_config)
  create or replace function public.prevent_entry_content_updates()
  returns trigger
  language plpgsql
  as $trigger$
  begin
    if new.yearbook_id is distinct from old.yearbook_id
      or new.author_id is distinct from old.author_id
      or new.author_name is distinct from old.author_name
      or new.author_university is distinct from old.author_university
      or new.author_class is distinct from old.author_class
      or new.content_text is distinct from old.content_text
      or new.image_urls is distinct from old.image_urls
      or new.style_config is distinct from old.style_config
      or new.pdf_url is distinct from old.pdf_url
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Yearbook entries are immutable after creation.';
    end if;

    return new;
  end;
  $trigger$;

  drop trigger if exists entries_prevent_content_updates on public.entries;
  create trigger entries_prevent_content_updates
    before update on public.entries
    for each row execute procedure public.prevent_entry_content_updates();

  -- Login helper (email or username)
  create or replace function public.get_email_for_login(identifier text)
  returns text
  language plpgsql
  security definer
  set search_path = public
  as $fn$
  declare
    normalized text;
    resolved_email text;
  begin
    normalized := lower(trim(identifier));
    normalized := regexp_replace(normalized, '^@+', '');

    if normalized ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      return normalized;
    end if;

    select lower(p.email)
    into resolved_email
    from public.profiles as p
    where p.username = normalized;

    return resolved_email;
  end;
  $fn$;

  grant execute on function public.get_email_for_login(text) to anon, authenticated;

  -- Yearbook access check (bypasses RLS on yearbooks for policy checks)
  create or replace function public.can_submit_entry_to_yearbook(target_yearbook_id uuid)
  returns boolean
  language sql
  security definer
  set search_path = public
  stable
  as $fn$
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
  $fn$;

  grant execute on function public.can_submit_entry_to_yearbook(uuid) to authenticated;

  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $fn$
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

    insert into public.profiles (id, display_name, username, email)
    values (
      new.id,
      fallback_name,
      fallback_username,
      lower(new.email)
    );

    insert into public.yearbooks (owner_id)
    values (new.id);

    return new;
  end;
  $fn$;

  -- ===========================================================================
  -- B. STORAGE BUCKET
  -- ===========================================================================

  insert into storage.buckets (id, name, public)
  values ('entry-pdfs', 'entry-pdfs', false)
  on conflict (id) do nothing;

  insert into storage.buckets (id, name, public)
  values ('entry-images', 'entry-images', false)
  on conflict (id) do nothing;

  -- ===========================================================================
  -- C. RLS — drop old / broken policies, create correct ones
  -- ===========================================================================

  -- entries: submit
  drop policy if exists "Authenticated users can insert if they have yearbook access" on public.entries;
  create policy "Authenticated users can insert if they have yearbook access"
    on public.entries for insert to authenticated
    with check (
      auth.uid() = author_id
      and public.can_submit_entry_to_yearbook(yearbook_id)
    );

  -- entry-pdfs storage (path: {yearbook_id}/{author_id}.pdf)
  drop policy if exists "Authenticated users can upload entry pdfs" on storage.objects;
  drop policy if exists "Authorized users can read entry pdfs" on storage.objects;
  drop policy if exists "Authors can update own entry pdfs" on storage.objects;
  drop policy if exists "Authors can delete own entry pdfs" on storage.objects;

  create policy "Authenticated users can upload entry pdfs"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'entry-pdfs'
      and auth.uid() is not null
      and public.can_submit_entry_to_yearbook(((storage.foldername(name))[1])::uuid)
    );

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

  create policy "Authors can delete own entry pdfs"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'entry-pdfs'
      and (owner = auth.uid() or owner is null)
    );

  create policy "Authorized users can read entry pdfs"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'entry-pdfs'
      and exists (
        select 1
        from public.entries
        join public.yearbooks on yearbooks.id = entries.yearbook_id
        where entries.pdf_url = name
          and (entries.author_id = auth.uid() or yearbooks.owner_id = auth.uid())
      )
    );

  -- ===========================================================================
  -- D. WIPE SAMPLE DATA + STORAGE
  -- ===========================================================================

  delete from public.entries
  where yearbook_id in (yearbook1_id, yearbook2_id)
     or author_id in (user1_id, user2_id);

  delete from public.yearbook_invites
  where yearbook_id in (yearbook1_id, yearbook2_id);

  delete from public.yearbooks
  where owner_id in (user1_id, user2_id);

  delete from public.profiles
  where id in (user1_id, user2_id);

  -- Storage files cannot be deleted via SQL on hosted Supabase.
  -- npm run seed:dev removes PDFs under entry-pdfs using the Storage API.

  delete from auth.identities
  where user_id in (user1_id, user2_id);

  delete from auth.users
  where id in (user1_id, user2_id);

  -- ===========================================================================
  -- E. RECREATE AUTH + PUBLIC ROWS (passwords fixed via npm run seed:dev)
  -- ===========================================================================
  -- Hosted Supabase does not let you ALTER auth.users triggers.
  -- Inserting auth users runs handle_new_user (creates profile + a random yearbook).
  -- We then UPDATE the profile and REPLACE yearbooks with fixed IDs.

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      auth_instance_id,
      user1_id,
      'authenticated',
      'authenticated',
      'rebeccachencjy@gmail.com',
      crypt('------', gen_salt('bf')),
      now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"User 1","username":"user1"}'::jsonb,
      now(),
      now()
    ),
    (
      auth_instance_id,
      user2_id,
      'authenticated',
      'authenticated',
      'mantoumiaoshen@gmail.com',
      crypt('------', gen_salt('bf')),
      now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"User 2","username":"user2"}'::jsonb,
      now(),
      now()
    );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      user1_id,
      user1_id,
      user1_id::text,
      jsonb_build_object('sub', user1_id::text, 'email', 'rebeccachencjy@gmail.com'),
      'email',
      now(), now(), now()
    ),
    (
      user2_id,
      user2_id,
      user2_id::text,
      jsonb_build_object('sub', user2_id::text, 'email', 'mantoumiaoshen@gmail.com'),
      'email',
      now(), now(), now()
    );

  insert into public.profiles (id, display_name, username, email, university, graduation_class)
  values
    (user1_id, 'User 1', 'user1', 'rebeccachencjy@gmail.com', 'Sample University', '2026'),
    (user2_id, 'User 2', 'user2', 'mantoumiaoshen@gmail.com', 'Sample University', '2026')
  on conflict (id) do update set
    display_name = excluded.display_name,
    username = excluded.username,
    email = excluded.email,
    university = excluded.university,
    graduation_class = excluded.graduation_class;

  delete from public.yearbooks
  where owner_id in (user1_id, user2_id);

  insert into public.yearbooks (id, owner_id, share_mode, created_at)
  values
    (yearbook1_id, user1_id, 'link', now()),
    (yearbook2_id, user2_id, 'link', now());

  raise notice 'SQL reset complete. REQUIRED next step: npm run seed:dev (clears storage PDFs + fixes passwords)';
end;
$reset$;
