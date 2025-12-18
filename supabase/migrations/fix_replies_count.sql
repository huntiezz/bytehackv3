-- Update all existing threads with correct reply counts
UPDATE public.threads t
SET replies_count = (
    SELECT COUNT(*)
    FROM public.thread_replies r
    WHERE r.thread_id = t.id
);

-- Create a function to automatically update replies_count
CREATE OR REPLACE FUNCTION update_thread_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.threads
        SET replies_count = replies_count + 1
        WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.threads
        SET replies_count = GREATEST(0, replies_count - 1)
        WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_thread_replies_count ON public.thread_replies;

-- Create trigger to automatically update replies_count when replies are added/removed
CREATE TRIGGER trigger_update_thread_replies_count
AFTER INSERT OR DELETE ON public.thread_replies
FOR EACH ROW
EXECUTE FUNCTION update_thread_replies_count();

-- Also update view_count from views column if view_count is null
UPDATE public.threads
SET view_count = COALESCE(view_count, views, 0)
WHERE view_count IS NULL OR view_count = 0;
