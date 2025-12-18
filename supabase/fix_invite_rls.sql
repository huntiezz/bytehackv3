-- Allow service_role to bypass RLS for invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Note: The service_role (used by your API key) BYPASSES RLS by default in Supabase.
-- However, if you are not using the service_role client correctly, or if explicit policies block it, it will fail.

-- Create a policy to allow anyone to READ invite codes (needed for validation if not using admin client)
-- OR just rely on service_role.

-- Let's ensure there is a policy for public read if desired, OR verify service_role.

-- Ideally, registration uses service_role which ignores these policies.
-- BUT, if you want to be safe:

CREATE POLICY "Service role can do anything with invite codes"
ON public.invite_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
