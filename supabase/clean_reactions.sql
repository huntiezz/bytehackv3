DELETE FROM thread_reactions
WHERE emoji ~ '^[a-zA-Z0-9\s[:punct:]]+$';

ALTER TABLE thread_reactions
DROP CONSTRAINT IF EXISTS no_text_reactions;

ALTER TABLE thread_reactions
ADD CONSTRAINT no_text_reactions
CHECK (emoji !~ '^[a-zA-Z0-9\s[:punct:]]+$');

SELECT * FROM thread_reactions;
