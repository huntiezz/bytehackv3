-- Check if view_count has data
SELECT 
    id,
    title,
    category,
    view_count,
    views,
    (SELECT COUNT(*) FROM thread_views WHERE thread_id = threads.id) as actual_view_count
FROM public.threads
WHERE category ILIKE '%general%' OR category ILIKE '%tutorial%' OR category ILIKE '%anticheat%'
ORDER BY created_at DESC
LIMIT 25;

-- Also check the sum
SELECT 
    SUM(view_count) as total_view_count,
    SUM(views) as total_views,
    COUNT(*) as thread_count
FROM public.threads
WHERE category ILIKE '%general%' OR category ILIKE '%tutorial%' OR category ILIKE '%anticheat%';
