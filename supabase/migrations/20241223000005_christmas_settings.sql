
create table if not exists public.christmas_settings (
  id boolean primary key default true,
  is_enabled boolean default true
);

-- Ensure only one row exists
insert into public.christmas_settings (id, is_enabled) values (true, true)
on conflict (id) do nothing;

alter table public.christmas_settings enable row level security;

-- Policies
create policy "Admins can update settings"
  on public.christmas_settings
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Anyone can read settings"
  on public.christmas_settings
  for select
  using (true);
