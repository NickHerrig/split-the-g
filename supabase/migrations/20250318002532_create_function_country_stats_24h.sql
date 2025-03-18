CREATE OR REPLACE FUNCTION get_country_stats_24h()
RETURNS TABLE (
  country text,
  country_code text,
  submission_count bigint,
  average_score numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    country,
    country_code,
    COUNT(*) as submission_count,
    AVG(split_score) as average_score
  FROM scores
  WHERE 
    country IS NOT NULL
    AND created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY country, country_code
  ORDER BY submission_count DESC;
$$;
