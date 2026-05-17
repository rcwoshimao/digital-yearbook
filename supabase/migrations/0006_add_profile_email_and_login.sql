alter table public.profiles
add column if not exists email text;

update public.profiles as p
set email = lower(u.email)
from auth.users as u
where p.id = u.id
  and u.email is not null
  and (p.email is null or p.email = '');

create unique index if not exists profiles_email_key on public.profiles (lower(email));

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

  select lower(p.email)
  into resolved_email
  from public.profiles as p
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

  insert into public.profiles (id, display_name, username, email, avatar_url)
  values (
    new.id,
    fallback_name,
    fallback_username,
    lower(new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.yearbooks (owner_id)
  values (new.id);

  return new;
end;
$$;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = lower(new.email)
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email_from_auth();
