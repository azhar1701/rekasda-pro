-- Create calculations table
CREATE TABLE calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL,
  calculation_type TEXT CHECK (calculation_type IN ('manning', 'rational')) NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed)
CREATE POLICY "Allow all operations" ON calculations FOR ALL USING (true);