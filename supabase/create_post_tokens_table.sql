-- Create post_tokens table for tracking cryptographic post tokens
-- This prevents token reuse and replay attacks

CREATE TABLE IF NOT EXISTS public.post_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nonce TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_tokens_nonce ON public.post_tokens(nonce);
CREATE INDEX IF NOT EXISTS idx_post_tokens_user_id ON public.post_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_post_tokens_expires_at ON public.post_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_post_tokens_used ON public.post_tokens(used) WHERE used = false;

-- Enable RLS
ALTER TABLE public.post_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own tokens
CREATE POLICY "Users can insert their own tokens"
ON public.post_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own tokens
CREATE POLICY "Users can read their own tokens"
ON public.post_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own tokens (for marking as used)
CREATE POLICY "Users can update their own tokens"
ON public.post_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own expired tokens
CREATE POLICY "Users can delete their own tokens"
ON public.post_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tokens TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.post_tokens IS 'Stores cryptographic tokens for post creation with nonce tracking to prevent replay attacks';

