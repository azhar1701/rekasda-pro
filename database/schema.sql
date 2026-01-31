-- Create calculations table with enhanced metadata
CREATE TABLE calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  calculation_type VARCHAR(20) CHECK (calculation_type IN ('manning', 'rational')) NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  location JSONB,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX idx_calculations_type ON calculations(calculation_type);
CREATE INDEX idx_calculations_site ON calculations(site_name);
CREATE INDEX idx_calculations_location ON calculations USING GIN(location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calculations_updated_at
    BEFORE UPDATE ON calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust based on your needs)
CREATE POLICY "Allow all operations for authenticated users" ON calculations
  FOR ALL USING (true);

-- Or for anonymous access (less secure)
-- CREATE POLICY "Allow all operations for everyone" ON calculations
--   FOR ALL USING (true);