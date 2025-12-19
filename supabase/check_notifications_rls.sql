SELECT subheading, setting, row_security 
FROM pg_settings 
WHERE name = 'row_security';

SELECT * FROM pg_policies WHERE tablename = 'notifications';
