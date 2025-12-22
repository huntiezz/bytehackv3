-- Enable RLS on invite_codes if not already enabled
ALTER TABLE IF EXISTS public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on invite_codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Anyone can read invite_codes" ON public.invite_codes;

-- Policy: Admins can do everything
CREATE POLICY "Admins can do everything on invite_codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Policy: Service Role can do everything (Implicit, but ensuring no restrict policies exist)
-- (Postgres RLS is permissive for service_role by default)
