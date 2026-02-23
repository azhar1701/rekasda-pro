-- Drop existing table if exists and recreate with correct structure
DROP TABLE IF EXISTS calculations;

-- Create table with exact column names used in code
CREATE TABLE calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL,
  calculation_type TEXT CHECK (calculation_type IN ('manning', 'rational')) NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Enable all operations for all users" ON calculations
FOR ALL USING (true);