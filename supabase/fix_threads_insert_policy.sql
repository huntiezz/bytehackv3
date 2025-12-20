-- Fix threads table RLS policies to allow INSERT
-- This allows authenticated users to create posts

-- First, ensure RLS is enabled
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own threads" ON public.threads;
DROP POLICY IF EXISTS "Threads insertable by authenticated users" ON public.threads;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.threads;

-- Create INSERT policy for authenticated users
-- Users can only insert threads where they are the author
CREATE POLICY "Users can insert their own threads"
ON public.threads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Ensure SELECT policy exists for reading threads
DROP POLICY IF EXISTS "Threads readable by everyone" ON public.threads;
DROP POLICY IF EXISTS "Threads readable by authenticated users" ON public.threads;

CREATE POLICY "Threads readable by everyone"
ON public.threads
FOR SELECT
TO public
USING (true);

-- Create UPDATE policy (users can edit their own threads)
DROP POLICY IF EXISTS "Users can update their own threads" ON public.threads;

CREATE POLICY "Users can update their own threads"
ON public.threads
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Create DELETE policy (users can delete their own threads, or admins can delete any)
DROP POLICY IF EXISTS "Users can delete their own threads" ON public.threads;

CREATE POLICY "Users can delete their own threads"
ON public.threads
FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT SELECT ON public.threads TO anon;

