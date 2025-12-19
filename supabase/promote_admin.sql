-- Helper function/query to promote a user to admin
-- Replace 'username_here' with the actual username

UPDATE profiles
SET role = 'admin', is_admin = true
WHERE username = 'username_here'; -- REPLACE THIS

-- Or by Email if you know it
-- UPDATE profiles SET role = 'admin', is_admin = true WHERE email = 'email@example.com';
