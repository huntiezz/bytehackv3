SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles';

SELECT * FROM profiles WHERE username = 'Lua' OR display_name = 'Lua' LIMIT 1;
