-- Add token/invite_code column to profiles for tracking origin and applying specific rules
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);
