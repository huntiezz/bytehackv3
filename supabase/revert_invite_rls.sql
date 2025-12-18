-- Revert invite codes policies to original state (or similar simplified state)
-- 1. Drop the new global admin policy
DROP POLICY IF EXISTS "Admins full access" ON public.invite_codes;

-- 2. Drop any other potential conflicts
DROP POLICY IF EXISTS "Admins manage invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins can create invite codes" ON public.invite_codes;

-- 3. Recreate a basic policy (Optional: modify as needed to match exactly what you had before)
-- This assumes standard authenticated access might be needed, or restrict it more if preferred.
-- If you want NO RLS (dangerous but reverts "blocking"), you can disable it, but better to have a basic one.

-- Basic policy: Authenticated users can read
DROP POLICY IF EXISTS "Authenticated can read invite codes" ON public.invite_codes;
CREATE POLICY "Authenticated can read invite codes"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only allow admins (checking the column you likely used before) to ALL
DROP POLICY IF EXISTS "Admins full access basic" ON public.invite_codes;
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
