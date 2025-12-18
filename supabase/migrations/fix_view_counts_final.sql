-- Step 1: Update view_count to match actual thread_views
UPDATE public.threads t
SET view_count = (
    SELECT COUNT(DISTINCT user_id)
    FROM public.thread_views v
    WHERE v.thread_id = t.id
)
WHERE EXISTS (
    SELECT 1 FROM public.thread_views v WHERE v.thread_id = t.id
);

-- Step 2: Set view_count to 0 for threads with no views
UPDATE public.threads
SET view_count = 0
WHERE view_count IS NULL;

-- Step 3: Create a function to automatically update view_count when views are added
CREATE OR REPLACE FUNCTION update_thread_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.threads
    SET view_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM public.thread_views
        WHERE thread_id = NEW.thread_id
    )
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-update view_count
DROP TRIGGER IF EXISTS trigger_update_thread_view_count ON public.thread_views;

CREATE TRIGGER trigger_update_thread_view_count
AFTER INSERT ON public.thread_views
FOR EACH ROW
EXECUTE FUNCTION update_thread_view_count();

-- Step 5: Verify the data
SELECT 
    category,
    COUNT(*) as thread_count,
    SUM(view_count) as total_views
FROM public.threads
GROUP BY category
ORDER BY thread_count DESC;
