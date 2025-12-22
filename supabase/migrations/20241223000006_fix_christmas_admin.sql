
-- Initialize christmas_settings if not exists
insert into public.christmas_settings (id, is_enabled)
values (true, true)
on conflict (id) do nothing;

-- Update Policies for christmas_attempts to allow admin view
drop policy if exists "Admins can view all attempts" on public.christmas_attempts;
create policy "Admins can view all attempts"
  on public.christmas_attempts
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Ensure normal users can insert (attempting) - usually handled by Service Role in API, 
-- but if we want strict RLS for safety:
drop policy if exists "Service Role can insert attempts" on public.christmas_attempts;
-- Service role bypasses RLS anyway, so no policy needed for insert if ONLY used by API.
-- However, we must ensure 'read' is blocked for normal users to prevent scraping.
-- The default allow none is good. But Admin needs read for the dashboard.
