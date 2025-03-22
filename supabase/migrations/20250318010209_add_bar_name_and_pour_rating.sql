-- Add bar_name and pour_rating columns to scores table
ALTER TABLE public.scores
ADD COLUMN bar_name TEXT,
ADD COLUMN pour_rating DECIMAL(3,2) CHECK (pour_rating >= 0 AND pour_rating <= 5);

-- Add comment to explain the columns
COMMENT ON COLUMN scores.bar_name IS 'Name of the bar where the Guinness was poured';
COMMENT ON COLUMN scores.pour_rating IS 'User rating of the pour quality (0-5 with 2 decimal places)';

-- Update existing rows to have NULL values for these columns
UPDATE scores SET bar_name = NULL, pour_rating = NULL; 