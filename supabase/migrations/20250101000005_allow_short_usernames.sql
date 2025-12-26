-- Drop any check constraint on username length if it exists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'c'
        AND (pg_get_constraintdef(oid) ILIKE '%username%' AND pg_get_constraintdef(oid) ILIKE '%length%')
    ) LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Also update VALIDATION_RULES in any remaining files if found
-- (Handled separately in component edits)
