-- Enable RLS on profiles if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing generic read policy if acts weird (optional, but good practice to clean up)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Allow everyone to view profiles (since it's a forum, usually public)
-- OR if you want only admins to see full lists:
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  id = auth.uid() -- Users can see themselves
);

-- Additionally, allow generic public read if that's desired (usually yes for forums)
-- But for the Admin Panel "0 users" bug, the Admin policy above is key.

-- Allow admins to UPDATE profiles (for roles, badges, bans)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
