-- =============================================================================
-- Email change stuck / no mail received — run in Supabase SQL Editor
-- =============================================================================

-- 1) See current auth state for user2
select
  p.username,
  p.email as profiles_email,
  u.email as sign_in_email,
  nullif(lower(trim(u.email_change)), '') as pending_new_email,
  u.email_confirmed_at
from public.profiles p
join auth.users u on u.id = p.id
where p.username = 'user2';

-- profiles.email stays at sign_in_email until you confirm the link in the NEW inbox.
-- After confirmation, auth.users.email updates and the sync trigger updates profiles.email.

-- -----------------------------------------------------------------------------
-- 2) CANCEL a stuck pending change (user stays on mantoumiaoshen@gmail.com)
-- -----------------------------------------------------------------------------
-- update auth.users
-- set
--   email_change = '',
--   email_change_token_new = '',
--   email_change_token_current = ''
-- where id = '22222222-2222-4222-8222-222222222222';

-- -----------------------------------------------------------------------------
-- 3) DEV ONLY — apply the new email without waiting for mail (user2 → jic098@ucsd.edu)
-- -----------------------------------------------------------------------------
-- update auth.users
-- set
--   email = 'jic098@ucsd.edu',
--   email_change = '',
--   email_change_token_new = '',
--   email_change_token_current = '',
--   email_confirmed_at = coalesce(email_confirmed_at, now())
-- where id = '22222222-2222-4222-8222-222222222222';
--
-- update public.profiles
-- set email = 'jic098@ucsd.edu'
-- where id = '22222222-2222-4222-8222-222222222222';

-- -----------------------------------------------------------------------------
-- 4) Helper used by the app (optional if migration 0010 not applied yet)
-- -----------------------------------------------------------------------------
create or replace function public.get_my_pending_email_change()
returns text
language sql
security definer
set search_path = public
as $$
  select nullif(lower(trim(u.email_change)), '')
  from auth.users as u
  where u.id = auth.uid();
$$;

grant execute on function public.get_my_pending_email_change() to authenticated;
