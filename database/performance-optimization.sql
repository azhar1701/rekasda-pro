-- Database Performance Optimization
-- Add indexes for frequently queried fields

-- Index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_calculations_created_at 
ON calculations(created_at DESC);

-- Index on calculation_type for filtering
CREATE INDEX IF NOT EXISTS idx_calculations_type 
ON calculations(calculation_type);

-- Index on site_name for search functionality
CREATE INDEX IF NOT EXISTS idx_calculations_site_name 
ON calculations(site_name);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_calculations_type_date 
ON calculations(calculation_type, created_at DESC);

-- Index for location-based queries (if using PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_calculations_location 
-- ON calculations USING GIST(location);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see all data
CREATE POLICY IF NOT EXISTS "Users can view all calculations" 
ON calculations FOR SELECT 
USING (true);

-- Policy for authenticated users to insert data
CREATE POLICY IF NOT EXISTS "Users can insert calculations" 
ON calculations FOR INSERT 
WITH CHECK (true);

-- Policy for authenticated users to update their own data
CREATE POLICY IF NOT EXISTS "Users can update calculations" 
ON calculations FOR UPDATE 
USING (true);

-- Policy for authenticated users to delete data
CREATE POLICY IF NOT EXISTS "Users can delete calculations" 
ON calculations FOR DELETE 
USING (true);

-- Add constraints for data integrity
ALTER TABLE calculations 
ADD CONSTRAINT IF NOT EXISTS chk_calculation_type 
CHECK (calculation_type IN ('manning', 'rational'));

-- Add constraint for non-empty site names
ALTER TABLE calculations 
ADD CONSTRAINT IF NOT EXISTS chk_site_name_not_empty 
CHECK (length(trim(site_name)) > 0);

-- Create view for common queries
CREATE OR REPLACE VIEW calculation_summary AS
SELECT 
    calculation_type,
    COUNT(*) as total_count,
    AVG((result_data->>'Discharge')::numeric) as avg_discharge,
    MAX((result_data->>'Discharge')::numeric) as max_discharge,
    MIN((result_data->>'Discharge')::numeric) as min_discharge,
    DATE_TRUNC('month', created_at) as month
FROM calculations 
WHERE result_data->>'Discharge' IS NOT NULL
GROUP BY calculation_type, DATE_TRUNC('month', created_at)
ORDER BY month DESC, calculation_type;

-- Create function for data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_calculations(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM calculations 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE calculations IS 'Stores hydraulic calculation results from field measurements';
COMMENT ON COLUMN calculations.calculation_type IS 'Type of calculation: manning or rational';
COMMENT ON COLUMN calculations.input_data IS 'JSON object containing all input parameters';
COMMENT ON COLUMN calculations.result_data IS 'JSON object containing calculation results';
COMMENT ON COLUMN calculations.site_name IS 'Name/identifier of the measurement site';

-- Analyze table for query optimization
ANALYZE calculations;