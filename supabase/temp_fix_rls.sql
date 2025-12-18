-- TEMPORARY: Make threads readable by everyone (for debugging)
-- This will help us confirm if RLS is the issue
DROP POLICY IF EXISTS "Threads readable by authenticated users" ON public.threads;

CREATE POLICY "Threads readable by everyone"
ON public.threads
FOR SELECT
TO public
USING (true);

-- After confirming this works, you can revert to authenticated-only:
-- DROP POLICY IF EXISTS "Threads readable by everyone" ON public.threads;
-- CREATE POLICY "Threads readable by authenticated users"
-- ON public.threads
-- FOR SELECT
-- TO public
-- USING (auth.role() = 'authenticated');
