
alter table public.christmas_attempts 
add column if not exists fingerprint text;

create index if not exists idx_christmas_attempts_fingerprint on public.christmas_attempts(fingerprint);
