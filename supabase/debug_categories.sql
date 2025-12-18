-- Query to see all unique categories in threads table
SELECT DISTINCT category, COUNT(*) as thread_count
FROM public.threads
GROUP BY category
ORDER BY thread_count DESC;

-- Query to see what categories a specific user has access to
-- Replace 'USER_ID_HERE' with actual user ID
SELECT category
FROM public.forum_category_permissions
WHERE user_id = 'USER_ID_HERE';
