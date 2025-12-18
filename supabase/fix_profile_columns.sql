DO \$\$ 
BEGIN
    -- Ensure 'role' column acts correctly, defaulting to 'member' if using text roles, 
    -- but user prefers logic relying on 'is_admin'.
    
    -- Check if 'is_admin' exists, add it if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;

    -- Also ensure 'role' exists as a fallback or for RBAC, but default it to 'member'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member';
    END IF;
    
    -- Ensure other vital columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
    END IF;
END \$\$;
