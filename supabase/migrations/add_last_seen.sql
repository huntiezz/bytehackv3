-- Add missing last_seen column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
