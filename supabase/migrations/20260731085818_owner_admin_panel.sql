create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Users can read their own admin status"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create or replace function public.assign_project_owner_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'iskander.jainakbayev@gmail.com'
    and new.email_confirmed_at is not null then
    insert into public.admin_users (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_project_owner_admin() from public, anon, authenticated;

create trigger assign_project_owner_admin_after_auth_change
after insert or update of email, email_confirmed_at
on auth.users
for each row
execute function public.assign_project_owner_admin();

insert into public.admin_users (user_id)
select id
from auth.users
where lower(coalesce(email, '')) = 'iskander.jainakbayev@gmail.com'
  and email_confirmed_at is not null
on conflict (user_id) do nothing;
