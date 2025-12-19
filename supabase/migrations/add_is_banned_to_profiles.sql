-- Add is_banned column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Update existing profiles based on active bans
UPDATE public.profiles
SET is_banned = true
WHERE id IN (
    SELECT user_id FROM public.bans WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
);
