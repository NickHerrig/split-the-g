-- Add location columns to scores table
ALTER TABLE public.scores
ADD COLUMN city TEXT,
ADD COLUMN region TEXT,
ADD COLUMN country TEXT,
ADD COLUMN country_code TEXT;

-- Add comment for the new fields
COMMENT ON COLUMN public.scores.city IS 'City name from IP geolocation';
COMMENT ON COLUMN public.scores.region IS 'Region/state from IP geolocation';
COMMENT ON COLUMN public.scores.country IS 'Country name from IP geolocation';
COMMENT ON COLUMN public.scores.country_code IS 'Country code from IP geolocation';
