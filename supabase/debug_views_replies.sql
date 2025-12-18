-- Check which view column has data
SELECT 
    id,
    title,
    views,
    view_count,
    replies_count,
    (SELECT COUNT(*) FROM thread_replies WHERE thread_id = threads.id) as actual_reply_count
FROM public.threads
LIMIT 10;
