
alter table public.christmas_attempts 
add column if not exists device_id text;

create index if not exists idx_christmas_attempts_device_id on public.christmas_attempts(device_id);
