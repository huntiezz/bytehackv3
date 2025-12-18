-- check what the current user looks like to the RLS system
SELECT 
  auth.uid() as my_auth_id,
  (SELECT role FROM public.profiles WHERE id = auth.uid()) as my_profile_role,
  (SELECT count(*) FROM public.profiles WHERE id = auth.uid()) as can_i_read_my_profile;
