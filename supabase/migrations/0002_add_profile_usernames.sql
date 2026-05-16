alter table public.profiles
add column if not exists username text;

update public.profiles
set username = regexp_replace(lower(display_name), '[^a-z0-9_]+', '_', 'g') || '_' || substr(id::text, 1, 8)
where username is null;

update public.profiles
set username = 'user_' || substr(id::text, 1, 8)
where username is null or username = '';

alter table public.profiles
alter column username set not null;

create unique index if not exists profiles_username_key on public.profiles (username);

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
