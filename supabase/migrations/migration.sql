-- Migration script to add metadata columns to existing calculations table
-- Run this if you already have a calculations table

-- Add new columns
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_calculations_location ON calculations USING GIN(location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_calculations_updated_at ON calculations;
CREATE TRIGGER update_calculations_updated_at
    BEFORE UPDATE ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = created_at
UPDATE calculations 
SET updated_at = created_at 
WHERE updated_at IS NULL;