-- Fix location mapping for existing data
-- This script adds a separate location column and migrates existing location data

-- Add location column if it doesn't exist
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS location JSONB;

-- Update existing records to extract location from input_data
UPDATE calculations 
SET location = CASE 
    WHEN input_data->'location' IS NOT NULL THEN input_data->'location'
    WHEN input_data->'site'->'location' IS NOT NULL THEN input_data->'site'->'location'
    ELSE NULL
END
WHERE location IS NULL;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_calculations_location_coords 
ON calculations USING GIN((location->'latitude'), (location->'longitude'));

-- Add notes and photo_url columns if they don't exist
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Update existing records to extract notes and photo_url from input_data
UPDATE calculations 
SET notes = COALESCE(input_data->>'notes', notes),
    photo_url = COALESCE(input_data->>'photoUrl', photo_url)
WHERE notes IS NULL OR photo_url IS NULL;

-- Create a view for easier location queries
CREATE OR REPLACE VIEW calculations_with_location AS
SELECT 
    id,
    site_name,
    calculation_type,
    input_data,
    result_data,
    location,
    photo_url,
    notes,
    created_at,
    updated_at,
    CASE 
        WHEN location IS NOT NULL 
        AND location->>'latitude' IS NOT NULL 
        AND location->>'longitude' IS NOT NULL 
        THEN true 
        ELSE false 
    END as has_valid_location
FROM calculations;