-- Add columns to track username changes for rate limiting
-- We need to know when the user last changed their username, and how many times they've changed it in the current window.

-- Add last_username_change timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMPTZ;

-- Add username_change_count integer (default 0)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_change_count INTEGER DEFAULT 0;

-- Optional: If we want a strict "2 per 7 days", we might need a "window_start" or just logic on update.
-- Let's stick with the columns above and handle logic in API.
