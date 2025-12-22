
insert into public.invite_codes (code, used)
values 
  ('CHRISTMAS-TEST-1', false),
  ('CHRISTMAS-TEST-2', false),
  ('CHRISTMAS-TEST-3', false)
on conflict (code) do nothing;
