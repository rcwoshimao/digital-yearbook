alter table public.yearbooks
  add column if not exists cover_style_config jsonb not null default '{
    "background_color": "#e8e0d4",
    "pattern": "damask"
  }'::jsonb;
