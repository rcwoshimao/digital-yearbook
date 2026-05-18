-- =============================================================================
-- RUN IN SUPABASE SQL EDITOR (fixes user2 login + email sync + signup auth rows)
-- =============================================================================
-- After running this file, also run: npm run seed:dev
-- (re-applies passwords via Admin API and verifies both dev accounts)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) DIAGNOSTICS — inspect dev accounts (read results)
-- -----------------------------------------------------------------------------
select
  p.username,
  p.email as profile_email,
  u.email as auth_email,
  nullif(trim(u.email_change), '') as pending_email_change,
  u.email_confirmed_at is not null as email_confirmed,
  u.encrypted_password is not null as has_password,
  coalesce(u.confirmation_token, '') = '' as confirmation_token_ok,
  coalesce(u.recovery_token, '') = '' as recovery_token_ok,
  exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  ) as has_email_identity
from public.profiles p
join auth.users u on u.id = p.id
where p.username in ('user1', 'user2')
order by p.username;

-- -----------------------------------------------------------------------------
-- 2) REPAIR auth.users token columns (fixes "Database error querying schema")
-- -----------------------------------------------------------------------------
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change = coalesce(email_change, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change_token_new is null
  or email_change_token_current is null
  or email_change is null;

-- -----------------------------------------------------------------------------
-- 3) SYNC profiles.email FROM auth.users (fixes username login for user2)
--    Uses confirmed auth email only — not pending new_email.
-- -----------------------------------------------------------------------------
update public.profiles p
set email = lower(u.email)
from auth.users u
where p.id = u.id
  and u.email is not null
  and (p.email is null or lower(trim(p.email)) is distinct from lower(u.email));

-- Clear stale pending email changes that block login (optional — only if stuck)
-- Uncomment if a user cannot log in after a failed email change:
-- update auth.users
-- set
--   email_change = '',
--   email_change_token_new = '',
--   email_change_token_current = ''
-- where nullif(trim(email_change), '') is not null;

-- -----------------------------------------------------------------------------
-- 4) ENSURE email identities exist for email/password users
-- -----------------------------------------------------------------------------
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
select
  u.id,
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email is not null
  and not exists (
    select 1
    from auth.identities i
    where i.user_id = u.id
      and i.provider = 'email'
  );

-- -----------------------------------------------------------------------------
-- 5) DROP unused profile column + refresh helpers (same as migration 0009)
-- -----------------------------------------------------------------------------
alter table public.profiles
drop column if exists avatar_url;

create or replace function public.get_email_for_login(identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  resolved_email text;
begin
  normalized := lower(trim(identifier));
  normalized := regexp_replace(normalized, '^@+', '');

  if normalized ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return normalized;
  end if;

  select lower(coalesce(nullif(trim(p.email), ''), u.email))
  into resolved_email
  from public.profiles as p
  inner join auth.users as u on u.id = p.id
  where p.username = normalized;

  return resolved_email;
end;
$$;

grant execute on function public.get_email_for_login(text) to anon, authenticated;

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
$$;

-- -----------------------------------------------------------------------------
-- 6) RE-RUN DIAGNOSTICS
-- -----------------------------------------------------------------------------
select
  p.username,
  p.email as profile_email,
  u.email as auth_email,
  public.get_email_for_login(p.username) as login_email_for_username
from public.profiles p
join auth.users u on u.id = p.id
where p.username in ('user1', 'user2')
order by p.username;
