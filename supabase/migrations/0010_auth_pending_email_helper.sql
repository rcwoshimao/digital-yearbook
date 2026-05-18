-- Read pending email change from auth.users (email_change column) when the JWT omits new_email.

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
