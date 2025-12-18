-- Force enable reading own profile for RLS checks
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( id = auth.uid() );

-- Now re-apply the Admin Invite Creation Policy with explicit permission
DROP POLICY IF EXISTS "Admins full access basic" ON public.invite_codes;

-- Allow INSERT/UPDATE/DELETE if user has admin role
CREATE POLICY "Admins full access basic"
ON public.invite_codes
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
