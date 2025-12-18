-- Create an enum for user roles if not exists (Best practice for roles)
-- However, since the app treats role as TEXT currently, let's keep it simple.
-- If you want strict types: CREATE TYPE user_role AS ENUM ('user', 'admin', 'offset_updater', 'moderator');

-- Add the 'role' column to profiles if it doesn't default exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set up roles for admin logic (example)
-- UPDATE profiles SET role = 'admin' WHERE username = 'your_username';

-- Note on Permissions:
-- The application code checks `user.role` in `getCurrentUser()` or directly in DB queries.
-- Make sure your `profiles` table has RLS policies that allow users to read their own role, 
-- and public to read roles if necessary for UI (e.g. badges).

-- Policy: Everyone can see roles (needed for badges)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Policy: Only admins (or service role) can update roles
-- This is implicitly handled if you don't add an UPDATE policy for 'role' column specifically for users.
-- Standard user update policy usually excludes sensitive columns like 'role'.
