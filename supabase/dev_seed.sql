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
  style_config,
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
    '{"background_color":"#fffdf5","pattern":"lined","font":"serif","ink_color":"#1a1a1a","border":"classic"}'::jsonb,
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
    '{"background_color":"#fdecea","pattern":"dotted","font":"handwritten","ink_color":"#4a1a1a","border":"corner"}'::jsonb,
    now() - interval '11 minutes',
    true
  ),
  (
    'eeeeeeee-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Mia Chen',
    'Sample University',
    '2026',
    'Rebecca, your late-night debugging playlists deserve their own campus legend. Thank you for making every deadline feel a little less scary.',
    array[]::text[],
    '{"background_color":"#e8f5f0","pattern":"grid","font":"mono","ink_color":"#1a3a2a","border":"double"}'::jsonb,
    now() - interval '10 minutes',
    true
  ),
  (
    'eeeeeeee-4444-4444-8444-444444444444',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Jordan Lee',
    'Sample University',
    '2026',
    'I will never forget the way you turned our messy idea into a real demo. Keep building things that make people smile.',
    array[]::text[],
    '{"background_color":"#e8f0fd","pattern":"lined","font":"serif","ink_color":"#1a2e4a","border":"classic"}'::jsonb,
    now() - interval '9 minutes',
    true
  ),
  (
    'eeeeeeee-5555-4555-8555-555555555555',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Avery Patel',
    'Sample University',
    '2026',
    'From coffee runs to capstone chaos, you always brought calm energy. I hope post-grad life gives you the same kindness you gave everyone else.',
    array[]::text[],
    '{"background_color":"#f0e8fd","pattern":"dotted","font":"handwritten","ink_color":"#1a1a1a","border":"none"}'::jsonb,
    now() - interval '8 minutes',
    true
  ),
  (
    'eeeeeeee-6666-4666-8666-666666666666',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Sam Rivera',
    'Sample University',
    '2026',
    'You made study group feel like a team, not a panic room. Thank you for explaining the hard parts and laughing through the weird parts.',
    array[]::text[],
    '{"background_color":"#fdf8e1","pattern":"grid","font":"serif","ink_color":"#1a3a2a","border":"corner"}'::jsonb,
    now() - interval '7 minutes',
    true
  ),
  (
    'eeeeeeee-7777-4777-8777-777777777777',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Taylor Kim',
    'Sample University',
    '2026',
    'Your yearbook needs a page for all the tiny wins: fixed bugs, shared snacks, perfect timing, and somehow always finding a seat in the library.',
    array[]::text[],
    '{"background_color":"#fde8f0","pattern":"lined","font":"handwritten","ink_color":"#4a1a1a","border":"double"}'::jsonb,
    now() - interval '6 minutes',
    true
  ),
  (
    'eeeeeeee-8888-4888-8888-888888888888',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Noah Brooks',
    'Sample University',
    '2026',
    'You are the person everyone wanted on their project team: thoughtful, prepared, and secretly hilarious. Congratulations on everything.',
    array[]::text[],
    '{"background_color":"#e8edf5","pattern":"dotted","font":"mono","ink_color":"#1a2e4a","border":"classic"}'::jsonb,
    now() - interval '5 minutes',
    true
  ),
  (
    'eeeeeeee-9999-4999-8999-999999999999',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Priya Shah',
    'Sample University',
    '2026',
    'I hope you keep choosing big dreams and excellent dessert. Your next chapter is lucky to have you.',
    array[]::text[],
    '{"background_color":"#fffdf5","pattern":"none","font":"serif","ink_color":"#1a1a1a","border":"double"}'::jsonb,
    now() - interval '4 minutes',
    true
  ),
  (
    'eeeeeeee-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Chris Nguyen',
    'Sample University',
    '2026',
    'Remember when our presentation laptop updated five minutes before class? You handled it like a pro. That is exactly why you will be great.',
    array[]::text[],
    '{"background_color":"#fdecea","pattern":"grid","font":"mono","ink_color":"#4a1a1a","border":"classic"}'::jsonb,
    now() - interval '3 minutes',
    true
  ),
  (
    'eeeeeeee-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Emma Wilson',
    'Sample University',
    '2026',
    'You made campus feel warmer. Thanks for the hallway hellos, the good advice, and the kind of friendship that lasts past graduation.',
    array[]::text[],
    '{"background_color":"#e8f5f0","pattern":"lined","font":"handwritten","ink_color":"#1a3a2a","border":"corner"}'::jsonb,
    now() - interval '2 minutes',
    true
  ),
  (
    'eeeeeeee-cccc-4ccc-8ccc-ccccccccccc1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'Lucas Martin',
    'Sample University',
    '2026',
    'Class of 2026 would not have been the same without your ideas, your questions, and your habit of making everyone feel included.',
    array[]::text[],
    '{"background_color":"#e8f0fd","pattern":"dotted","font":"serif","ink_color":"#1a2e4a","border":"none"}'::jsonb,
    now() - interval '1 minute',
    true
  ),
  (
    'eeeeeeee-dddd-4ddd-8ddd-ddddddddddd1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-111111111111',
    'Rebecca Chen',
    'Sample University',
    '2026',
    'Adding one more page for Mantou so the book has a real ending: keep being curious, brave, and impossible to beat at card games.',
    array[]::text[],
    '{"background_color":"#fdf8e1","pattern":"lined","font":"handwritten","ink_color":"#1a1a1a","border":"double"}'::jsonb,
    now(),
    true
  )
on conflict (id) do nothing;
