create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

revoke all on public.customer_profiles from anon, authenticated, public;
grant select on public.customer_profiles to authenticated;

drop policy if exists "Customers can view their own profile"
  on public.customer_profiles;
create policy "Customers can view their own profile"
  on public.customer_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Customers can update their own profile"
  on public.customer_profiles;
create or replace function public.sync_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  if new.email is null then
    return new;
  end if;

  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.customer_profiles (user_id, full_name, email, updated_at)
  values (new.id, profile_name, lower(new.email), now())
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_customer_profile on auth.users;
create trigger sync_customer_profile
  after insert or update of email, raw_user_meta_data on auth.users
  for each row
  execute function public.sync_customer_profile();

insert into public.customer_profiles (user_id, full_name, email)
select
  id,
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
    split_part(email, '@', 1)
  ),
  lower(email)
from auth.users
where email is not null
on conflict (user_id) do nothing;
