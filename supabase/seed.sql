-- Reset sequences and clear existing data
TRUNCATE TABLE public.scores RESTART IDENTITY CASCADE;

-- Create temporary function to generate random data
CREATE OR REPLACE FUNCTION random_between(low INT, high INT) 
RETURNS INT AS
$$
BEGIN
   RETURN floor(random() * (high-low+1) + low);
END;
$$ language 'plpgsql' STRICT;

-- Define country codes and names for consistency
DO $$
DECLARE
    country_data TEXT[][] := ARRAY[
        ['US', 'United States'],
        ['GB', 'United Kingdom'],
        ['CA', 'Canada'],
        ['AU', 'Australia'],
        ['IE', 'Ireland'],
        ['DE', 'Germany'],
        ['FR', 'France'],
        ['ES', 'Spain'],
        ['IT', 'Italy'],
        ['JP', 'Japan'],
        ['CN', 'China'],
        ['IN', 'India'],
        ['BR', 'Brazil'],
        ['MX', 'Mexico'],
        ['ZA', 'South Africa']
    ];
    city_names TEXT[] := ARRAY['New York', 'London', 'Toronto', 'Sydney', 'Dublin', 'Berlin', 
                              'Paris', 'Madrid', 'Rome', 'Tokyo', 'Beijing', 'Mumbai', 
                              'São Paulo', 'Mexico City', 'Cape Town', 'Chicago', 'Manchester',
                              'Vancouver', 'Melbourne', 'Cork', 'Munich', 'Lyon', 'Barcelona',
                              'Milan', 'Osaka', 'Shanghai', 'Delhi', 'Rio de Janeiro',
                              'Guadalajara', 'Johannesburg'];
    region_names TEXT[] := ARRAY['New York', 'England', 'Ontario', 'New South Wales', 'Leinster',
                               'Bavaria', 'Île-de-France', 'Catalonia', 'Lombardy', 'Kanto',
                               'Beijing', 'Maharashtra', 'São Paulo', 'Mexico State', 'Western Cape',
                               'Illinois', 'Greater Manchester', 'British Columbia', 'Victoria', 'Munster',
                               'Bavaria', 'Auvergne-Rhône-Alpes', 'Catalonia', 'Lombardy', 'Kansai',
                               'Shanghai', 'Delhi', 'Rio de Janeiro', 'Jalisco', 'Gauteng'];
    username_prefixes TEXT[] := ARRAY['happy', 'cool', 'super', 'mega', 'ultra', 'awesome', 'swift', 'clever', 
                                   'brilliant', 'smart', 'fancy', 'jolly', 'quick', 'eager', 'brave'];
    username_suffixes TEXT[] := ARRAY['gamer', 'coder', 'player', 'fan', 'lover', 'user', 'guru', 'master', 
                                   'expert', 'enthusiast', 'ninja', 'wizard', 'hacker', 'buddy', 'pro'];
    email_domains TEXT[] := ARRAY['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
                               'protonmail.com', 'aol.com', 'mail.com', 'example.com'];
    
    i INT;
    username TEXT;
    split_score DECIMAL(4,2);
    created_at TIMESTAMP WITH TIME ZONE;
    email TEXT;
    email_opted_out BOOLEAN;
    country_index INT;
    city_index INT;
    split_image_url TEXT;
    pint_image_url TEXT;
    session_id UUID;
    has_email BOOLEAN;
    prefix_idx INT;
    suffix_idx INT;
BEGIN
    -- Insert 8,000 older records (between 1-90 days old)
    FOR i IN 1..8000 LOOP
        -- Generate random data with safe array indexing
        prefix_idx := 1 + floor(random() * (array_length(username_prefixes, 1)))::INT;
        suffix_idx := 1 + floor(random() * (array_length(username_suffixes, 1)))::INT;
        
        username := username_prefixes[prefix_idx] || 
                    username_suffixes[suffix_idx] || 
                    random_between(100, 999)::TEXT;
        
        split_score := round((random() * 5)::numeric, 2);
        created_at := NOW() - (random() * 90 || ' days')::INTERVAL;
        
        has_email := random() > 0.7; -- 30% have email
        IF has_email THEN
            email := lower(username) || '@' || 
                    email_domains[1 + floor(random() * (array_length(email_domains, 1)))::INT];
            email_opted_out := random() > 0.9; -- 10% opt out
        ELSE
            email := NULL;
            email_opted_out := random() > 0.5; -- 50% explicitly opt out
        END IF;
        
        country_index := 1 + floor(random() * (array_length(country_data, 1)))::INT;
        city_index := 1 + floor(random() * (array_length(city_names, 1)))::INT;
        
        split_image_url := 'https://split-g-images.supabase.co/storage/v1/object/public/split-g-images/split_' || 
                         i::TEXT || '.jpg';
        pint_image_url := 'https://split-g-images.supabase.co/storage/v1/object/public/split-g-images/pint_' || 
                        i::TEXT || '.jpg';
                        
        session_id := gen_random_uuid();
        
        -- Insert the record
        INSERT INTO public.scores (
            username, 
            split_score, 
            created_at, 
            split_image_url, 
            pint_image_url, 
            email, 
            email_opted_out, 
            session_id,
            city,
            region,
            country,
            country_code
        ) VALUES (
            username,
            split_score,
            created_at,
            split_image_url, -- Always provide a URL, no NULL values
            pint_image_url,  -- Always provide a URL, no NULL values
            email,
            email_opted_out,
            session_id,
            city_names[city_index],
            region_names[city_index],
            country_data[country_index][2],
            country_data[country_index][1]
        );
    END LOOP;
    
    -- Insert 2,000 recent records (within the last 24 hours)
    FOR i IN 8001..10000 LOOP
        -- Generate random data with safe array indexing
        prefix_idx := 1 + floor(random() * (array_length(username_prefixes, 1)))::INT;
        suffix_idx := 1 + floor(random() * (array_length(username_suffixes, 1)))::INT;
        
        username := username_prefixes[prefix_idx] || 
                    username_suffixes[suffix_idx] || 
                    random_between(100, 999)::TEXT;
        
        split_score := round((random() * 5)::numeric, 2);
        created_at := NOW() - (random() * 24 || ' hours')::INTERVAL;
        
        has_email := random() > 0.5; -- 50% have email for recent records
        IF has_email THEN
            email := lower(username) || '@' || 
                    email_domains[1 + floor(random() * (array_length(email_domains, 1)))::INT];
            email_opted_out := random() > 0.9; -- 10% opt out
        ELSE
            email := NULL;
            email_opted_out := random() > 0.5; -- 50% explicitly opt out
        END IF;
        
        country_index := 1 + floor(random() * (array_length(country_data, 1)))::INT;
        city_index := 1 + floor(random() * (array_length(city_names, 1)))::INT;
        
        split_image_url := 'https://split-g-images.supabase.co/storage/v1/object/public/split-g-images/split_' || 
                         i::TEXT || '.jpg';
        pint_image_url := 'https://split-g-images.supabase.co/storage/v1/object/public/split-g-images/pint_' || 
                        i::TEXT || '.jpg';
                        
        session_id := gen_random_uuid();
        
        -- Insert the record
        INSERT INTO public.scores (
            username, 
            split_score, 
            created_at, 
            split_image_url, 
            pint_image_url, 
            email, 
            email_opted_out, 
            session_id,
            city,
            region,
            country,
            country_code
        ) VALUES (
            username,
            split_score,
            created_at,
            split_image_url, -- Always provide a URL, no NULL values
            pint_image_url,  -- Always provide a URL, no NULL values
            email,
            email_opted_out,
            session_id,
            city_names[city_index],
            region_names[city_index],
            country_data[country_index][2],
            country_data[country_index][1]
        );
    END LOOP;
END $$;

-- Clean up temporary function
DROP FUNCTION IF EXISTS random_between(INT, INT);

-- Verify data was inserted
SELECT COUNT(*) AS total_records FROM public.scores;
SELECT COUNT(*) AS recent_records FROM public.scores WHERE created_at >= NOW() - INTERVAL '24 hours';
