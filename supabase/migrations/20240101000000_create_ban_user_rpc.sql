-- RPC: ban_user
CREATE OR REPLACE FUNCTION ban_user(
    target_user_id UUID,
    ban_reason TEXT,
    banned_by_id UUID,
    ban_duration_hours INT DEFAULT NULL,
    also_blacklist_ip BOOLEAN DEFAULT TRUE,
    ip_to_ban TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_ban_id UUID;
    target_ip TEXT;
    expires_at_val TIMESTAMPTZ;
BEGIN
    -- Deactivate any existing active bans for this user
    UPDATE bans SET is_active = false WHERE user_id = target_user_id AND is_active = true;

    -- Determine expiration time
    IF ban_duration_hours IS NOT NULL THEN
        expires_at_val := NOW() + (ban_duration_hours || ' hours')::INTERVAL;
    ELSE
        expires_at_val := NULL;
    END IF;

    -- Insert into bans table
    INSERT INTO bans (user_id, reason, banned_by, expires_at, created_at, is_active)
    VALUES (target_user_id, ban_reason, banned_by_id, expires_at_val, NOW(), true)
    RETURNING id INTO new_ban_id;

    -- Update profile status
    UPDATE profiles SET is_banned = true WHERE id = target_user_id;

    -- Identify IP to ban if requested
    IF also_blacklist_ip THEN
        IF ip_to_ban IS NOT NULL THEN
            target_ip := ip_to_ban;
        ELSE
            BEGIN
                SELECT last_ip INTO target_ip FROM profiles WHERE id = target_user_id;
            EXCEPTION WHEN OTHERS THEN
                target_ip := NULL;
            END;
        END IF;

        IF target_ip IS NOT NULL THEN
            INSERT INTO ip_blacklist (ip_address, reason, banned_by, created_at)
            VALUES (target_ip, 'Banned user: ' || ban_reason, banned_by_id, NOW())
            ON CONFLICT (ip_address) DO NOTHING;
        END IF;
    END IF;

    RETURN new_ban_id;
END;
$$;

-- RPC: is_user_banned
CREATE OR REPLACE FUNCTION is_user_banned(check_user_id UUID)
RETURNS TABLE (
    is_banned BOOLEAN,
    ban_reason TEXT,
    banned_by_name TEXT,
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_banned,
        b.reason as ban_reason,
        p.username as banned_by_name,
        b.expires_at,
        (b.expires_at IS NULL) as is_permanent
    FROM bans b
    LEFT JOIN profiles p ON b.banned_by = p.id
    WHERE b.user_id = check_user_id
    AND b.is_active = true
    AND (b.expires_at IS NULL OR b.expires_at > NOW())
    LIMIT 1;
END;
$$;

-- RPC: is_ip_blacklisted
CREATE OR REPLACE FUNCTION is_ip_blacklisted(check_ip TEXT)
RETURNS TABLE (
    is_blacklisted BOOLEAN,
    reason TEXT,
    banned_by_name TEXT,
    created_at TIMESTAMPTZ,
    is_permanent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_blacklisted,
        ib.reason,
        p.username as banned_by_name,
        ib.created_at,
        true as is_permanent -- IPs are permanently blacklisted until removed
    FROM ip_blacklist ib
    LEFT JOIN profiles p ON ib.banned_by = p.id
    WHERE ib.ip_address = check_ip
    LIMIT 1;
END;
$$;
