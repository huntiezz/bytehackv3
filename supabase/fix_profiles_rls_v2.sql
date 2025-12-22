-- Function to check if the current user is an admin
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (likely postgres/superuser)
-- This bypasses RLS on the profiles table, preventing infinite recursion in the policy logic.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create the new non-recursive policy
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() -- Users can ALWAYS see themselves
  OR
  public.is_admin() -- Admins can see everyone (via secure function)
);
