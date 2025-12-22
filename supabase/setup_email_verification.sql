-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Add email_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS email_verifications_email_idx ON public.email_verifications (email);
