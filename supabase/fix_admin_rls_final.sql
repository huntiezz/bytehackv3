-- 1. Drop old policies
DROP POLICY IF EXISTS "Admins manage invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins can create invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins full access" ON public.invite_codes;

-- 2. Create the generic policy for ANY admin
-- This checks if the *current user* has the role 'admin' in their profile.
-- It does NOT check for a specific ID.
CREATE POLICY "Admins full access"
ON public.invite_codes
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
