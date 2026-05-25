-- New yearbooks default to invite-only; owners can switch to link sharing in the dashboard.
alter table public.yearbooks
  alter column share_mode set default 'invite_only';
