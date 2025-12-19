SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'u'; -- 'u' for unique constraints
