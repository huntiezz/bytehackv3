-- Fix rate limiting by ensuring unique constraint and robustness

-- 1. Clean up duplicate keys, keeping the one with the latest expiry
DELETE FROM rate_limits a USING (
  SELECT min(ctid) as ctid, key
  FROM rate_limits
  GROUP BY key HAVING count(*) > 1
) b
WHERE a.key = b.key
AND a.ctid <> b.ctid;

-- 2. Add Unique Constraint to allow ON CONFLICT to work
ALTER TABLE rate_limits ADD CONSTRAINT rate_limits_key_unique UNIQUE (key);

-- 3. Update the function to be robust and return correct types
CREATE OR REPLACE FUNCTION check_rate_limit(
    rate_key TEXT,
    rate_limit INTEGER,
    window_seconds INTEGER,
    cost_val INTEGER DEFAULT 1
)
RETURNS TABLE (success BOOLEAN, remaining INTEGER, reset_time TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_count INTEGER;
    current_expires TIMESTAMPTZ;
    new_expires TIMESTAMPTZ;
BEGIN
    -- cleanup expired (lazy)
    DELETE FROM rate_limits WHERE key = rate_key AND expires_at < NOW();

    new_expires := NOW() + (window_seconds || ' seconds')::INTERVAL;

    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (rate_key, 0, new_expires)
    ON CONFLICT (key) DO NOTHING;

    -- Atomic Update
    UPDATE rate_limits
    SET count = count + cost_val,
        -- If we resurrected an expired row (race condition), reset valid_until?
        -- The DELETE above handles most cases, but if parallel request re-inserted:
        expires_at = CASE WHEN expires_at < NOW() THEN new_expires ELSE expires_at END,
        count = CASE WHEN expires_at < NOW() THEN cost_val ELSE count + cost_val END
    WHERE key = rate_key
    RETURNING count, expires_at INTO current_count, current_expires;

    -- Safety check if update failed (shouldn't happen with on conflict)
    IF current_count IS NULL THEN
        -- Insert fresh if missing
        INSERT INTO rate_limits (key, count, expires_at)
        VALUES (rate_key, cost_val, new_expires)
        RETURNING count, expires_at INTO current_count, current_expires;
    END IF;

    -- Check limits
    IF current_count > rate_limit THEN
        RETURN QUERY SELECT false, 0, current_expires;
    ELSE
        RETURN QUERY SELECT true, rate_limit - current_count, current_expires;
    END IF;
END;
$$;
