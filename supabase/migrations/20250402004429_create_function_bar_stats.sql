-- Drop the existing function first
DROP FUNCTION IF EXISTS get_bar_stats();

-- Create a function to get bar statistics
CREATE OR REPLACE FUNCTION get_bar_stats()
RETURNS TABLE (
    bar_with_city TEXT,
    distinct_count BIGINT,
    average_pour_score DECIMAL(3,2)
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT 
    CONCAT(bar_name, ' (', SPLIT_PART(bar_address, ', ', 2), ')') AS bar_with_city, 
    COUNT(*) AS distinct_count, 
    ROUND(AVG(pour_rating), 2) AS average_pour_score
FROM scores
WHERE 
    pour_rating IS NOT NULL 
    AND COALESCE(bar_name, '') <> '' 
    AND COALESCE(bar_address, '') <> ''
GROUP BY bar_name, SPLIT_PART(bar_address, ', ', 2)
ORDER BY distinct_count DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION get_bar_stats IS 'Returns statistics about bars including the bar name with region, number of distinct ratings, and average pour rating. Only includes bars with more than one rating.'; 