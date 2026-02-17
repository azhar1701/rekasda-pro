-- Migration script to fix location mapping issues
-- Run this in your Supabase SQL editor

-- Step 1: Add missing columns
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Migrate existing location data
UPDATE calculations 
SET location = CASE 
    WHEN input_data->'location' IS NOT NULL THEN input_data->'location'
    WHEN input_data->'site'->'location' IS NOT NULL THEN input_data->'site'->'location'
    ELSE NULL
END
WHERE location IS NULL;

-- Step 3: Migrate existing notes and photo_url
UPDATE calculations 
SET notes = COALESCE(input_data->>'notes', notes),
    photo_url = COALESCE(input_data->>'photoUrl', input_data->'site'->>'photoUrl', photo_url)
WHERE notes IS NULL OR photo_url IS NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculations_location_coords 
ON calculations USING GIN((location->'latitude'), (location->'longitude'));

CREATE INDEX IF NOT EXISTS idx_calculations_has_location 
ON calculations ((location IS NOT NULL));

-- Step 5: Create a function to validate location data
CREATE OR REPLACE FUNCTION is_valid_location(loc JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN loc IS NOT NULL 
        AND loc->>'latitude' IS NOT NULL 
        AND loc->>'longitude' IS NOT NULL
        AND (loc->>'latitude')::NUMERIC BETWEEN -90 AND 90
        AND (loc->>'longitude')::NUMERIC BETWEEN -180 AND 180
        AND (loc->>'latitude')::NUMERIC != 0
        AND (loc->>'longitude')::NUMERIC != 0;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create view for calculations with valid locations
CREATE OR REPLACE VIEW calculations_with_valid_location AS
SELECT 
    *,
    is_valid_location(location) as has_valid_location
FROM calculations
WHERE is_valid_location(location) = true;

-- Step 7: Show statistics
SELECT 
    COUNT(*) as total_records,
    COUNT(location) as records_with_location,
    COUNT(CASE WHEN is_valid_location(location) THEN 1 END) as records_with_valid_location
FROM calculations;