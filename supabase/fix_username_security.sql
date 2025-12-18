-- Add a unique constraint to the username column in the profiles table
-- This ensures that the database rejects any attempt to insert or update a username 
-- to a value that already exists.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles (username);

-- Alternatively, using a constraint explicitly:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
