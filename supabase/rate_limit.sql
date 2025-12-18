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
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
