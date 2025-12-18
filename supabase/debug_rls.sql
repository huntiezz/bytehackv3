-- Check if RLS is enabled on threads table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'threads';

-- Check what RLS policies exist on threads table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'threads';

-- Test query to see if threads are visible (run this as the authenticated user)
SELECT id, title, category, author_id, created_at
FROM public.threads
ORDER BY created_at DESC
LIMIT 10;
