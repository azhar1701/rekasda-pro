-- Drop tabel lama jika ada
DROP TABLE IF EXISTS manning_calculations CASCADE;
DROP TABLE IF EXISTS flood_calculations CASCADE;
DROP TABLE IF EXISTS water_balance_calculations CASCADE;

-- Tabel untuk perhitungan Manning (Saluran)
CREATE TABLE manning_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk perhitungan Banjir (Rational & Nakayasu)
CREATE TABLE flood_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(20) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk perhitungan Neraca Air
CREATE TABLE water_balance_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  monthly_inputs JSONB NOT NULL,
  monthly_results JSONB NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk performa
CREATE INDEX idx_manning_created ON manning_calculations(created_at DESC);
CREATE INDEX idx_manning_project ON manning_calculations(project_name);
CREATE INDEX idx_flood_created ON flood_calculations(created_at DESC);
CREATE INDEX idx_flood_project ON flood_calculations(project_name);
CREATE INDEX idx_water_created ON water_balance_calculations(created_at DESC);
CREATE INDEX idx_water_project ON water_balance_calculations(project_name);

-- Enable RLS
ALTER TABLE manning_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flood_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_balance_calculations ENABLE ROW LEVEL SECURITY;

-- Policies untuk akses publik
CREATE POLICY "Allow all for manning" ON manning_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for flood" ON flood_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for water" ON water_balance_calculations FOR ALL USING (true);
