create table if not exists public.christmas_attempts (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ip_address)
);

alter table public.christmas_attempts enable row level security;

create policy "Service role can manage christmas attempts"
  on public.christmas_attempts
  for all
  to service_role
  using (true)
  with check (true);
