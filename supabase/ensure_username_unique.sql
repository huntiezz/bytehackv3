-- Create a unique index on username to prevent duplicates
-- Use CREATE UNIQUE INDEX IF NOT EXISTS to be safe

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Alternatively, add a constraint
-- ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
