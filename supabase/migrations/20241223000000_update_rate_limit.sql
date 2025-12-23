-- Create a table for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL, -- e.g. "reaction:userid:postid" or "comment:userid"
  last_action TIMESTAMPTZ DEFAULT NOW(),
  count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for cleanup and lookup
CREATE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits (key);
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits (expires_at);

-- Function to clean up expired limits (can be called periodically or lazily)
-- Function to clean up expired limits (can be called periodically or lazily)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Atomic Rate Limit Check Function
-- Prevents race conditions by locking the row during update
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
BEGIN
    -- Lazy cleanup for this specific key to ensure fresh window if expired
    DELETE FROM rate_limits WHERE key = rate_key AND expires_at < NOW();

    -- Initialize bucket if it doesn't exist
    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (rate_key, 0, NOW() + (window_seconds || ' seconds')::INTERVAL)
    ON CONFLICT (key) DO NOTHING;

    -- Atomic Update: Locks the row, ensuring sequential processing
    UPDATE rate_limits
    SET count = count + cost_val
    WHERE key = rate_key
    RETURNING count, expires_at INTO current_count, current_expires;

    -- Check if limit exceeded
    IF current_count > rate_limit THEN
        RETURN QUERY SELECT false, 0, current_expires;
    ELSE
        RETURN QUERY SELECT true, rate_limit - current_count, current_expires;
    END IF;
END;
$$;
