-- Dev-only seed data. Run this in a local/dev Supabase SQL editor, not production.
-- Passwords are the same as the email addresses for quick testing.

create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'rebeccachencjy@gmail.com',
    crypt('rebeccachencjy@gmail.com', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"User 1","username":"user1"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'mantoumiaoshen@gmail.com',
    crypt('mantoumiaoshen@gmail.com', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"User 2","username":"user2"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
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
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"rebeccachencjy@gmail.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"mantoumiaoshen@gmail.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, display_name, username, university, graduation_class)
values
  ('11111111-1111-4111-8111-111111111111', 'User 1', 'user1', 'Sample University', '2026'),
  ('22222222-2222-4222-8222-222222222222', 'User 2', 'user2', 'Sample University', '2026')
on conflict (id) do update
set
  display_name = excluded.display_name,
  username = excluded.username,
  university = excluded.university,
  graduation_class = excluded.graduation_class;

delete from public.yearbooks
where owner_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

insert into public.yearbooks (id, owner_id, share_mode, created_at)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'link',
    now()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'link',
    now()
  );

insert into public.entries (
  id,
  yearbook_id,
  author_id,
  author_name,
  author_university,
  author_class,
  content_text,
  image_urls,
  created_at,
  is_visible_to_owner
)
values
  (
    'eeeeeeee-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-111111111111',
    'User 1',
    'Sample University',
    '2026',
    'Mantou, thanks for making senior year brighter. I hope your next chapter is full of good food, good friends, and ridiculous stories.',
    array[]::text[],
    now(),
    true
  ),
  (
    'eeeeeeee-2222-4222-8222-222222222222',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'User 2',
    'Sample University',
    '2026',
    'Rebecca, you made every project feel possible. I am cheering for you always, class of 2026 forever!',
    array[]::text[],
    now(),
    true
  )
on conflict (id) do nothing;
