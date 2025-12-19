-- Create bans Table
CREATE TABLE IF NOT EXISTS public.bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    banned_by UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ, -- NULL means permanent
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial index allows multiple inactive bans but ensures only one active ban per user
DROP INDEX IF EXISTS idx_active_bans;
CREATE UNIQUE INDEX idx_active_bans ON public.bans (user_id) WHERE is_active = true;

-- Create ip_blacklist Table
CREATE TABLE IF NOT EXISTS public.ip_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    reason TEXT,
    banned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learn last_ip column if it doesn't exist (handled by separate migration usually but adding here for safety/completeness in dev)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip TEXT; 
-- (Commented out to avoid errors if already exists, usually better in separate file)

-- Enable RLS
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blacklist ENABLE ROW LEVEL SECURITY;

-- Policies for Bans
DROP POLICY IF EXISTS "Admins can manage bans" ON public.bans;
CREATE POLICY "Admins can manage bans" ON public.bans
FOR ALL USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view their own bans" ON public.bans;
CREATE POLICY "Users can view their own bans" ON public.bans
FOR SELECT USING (
  auth.uid() = user_id
);


-- Policies for IP Blacklist
DROP POLICY IF EXISTS "Admins can manage ip_blacklist" ON public.ip_blacklist;
CREATE POLICY "Admins can manage ip_blacklist" ON public.ip_blacklist
FOR ALL USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
