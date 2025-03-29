alter table "public"."scores" drop column "bar_address";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_bar_stats()
 RETURNS TABLE(bar_with_region text, distinct_count bigint, average_pour_score numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT 
        CONCAT(LOWER(REPLACE(bar_name, '''', '')), ' (', region, ')') AS bar_with_region, 
        COUNT(*) AS distinct_count, 
        ROUND(AVG(pour_rating), 2) AS average_pour_score
    FROM scores
    WHERE pour_rating IS NOT NULL
    GROUP BY LOWER(REPLACE(bar_name, '''', '')), region
    HAVING COUNT(*) > 1
    ORDER BY distinct_count DESC;
$function$
;


