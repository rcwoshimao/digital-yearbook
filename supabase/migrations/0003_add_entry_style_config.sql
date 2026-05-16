alter table public.entries
  add column if not exists style_config jsonb not null default '{
    "background_color": "#fffdf5",
    "pattern": "none",
    "font": "serif",
    "ink_color": "#1a1a1a",
    "border": "none"
  }'::jsonb;

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
    or new.style_config is distinct from old.style_config
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Yearbook entries are immutable after creation.';
  end if;

  return new;
end;
$$;
