-- Check if the table exists and show structure
SELECT * 
FROM information_schema.columns 
WHERE table_name = 'invite_codes';

-- List all invite codes (limited to 10 latest) to verify content
SELECT * 
FROM public.invite_codes 
ORDER BY created_at DESC 
LIMIT 10;

-- Check Row Level Security (RLS) policies on the table
-- If policies are too restrictive, even the service_role might be blocked (rare but possible with `auth.uid()` checks)
SELECT * 
FROM pg_policies 
WHERE tablename = 'invite_codes';

-- Check specific permissions for the 'service_role' (used by your API)
-- Should show 'postgres' or 'service_role' having ALL permissions
SELECT trainee, grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'invite_codes';
