-- Add wallet columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_daily_claim timestamptz;

-- Add tracking to invite_codes
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
