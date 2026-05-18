-- Remove unused profile column and harden login email resolution.

alter table public.profiles
drop column if exists avatar_url;

-- Username login: prefer profiles.email, fall back to auth.users.email.
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

-- Keep profiles.email aligned with confirmed auth email (not pending new_email).
create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles
    set email = lower(new.email)
    where id = new.id;
  end if;

  return new;
end;
$$;
