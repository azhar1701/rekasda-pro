-- Tabel untuk perhitungan Manning (Saluran)
CREATE TABLE IF NOT EXISTS manning_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk perhitungan Banjir (Rational & Nakayasu)
CREATE TABLE IF NOT EXISTS flood_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(20) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk perhitungan Neraca Air
CREATE TABLE IF NOT EXISTS water_balance_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  monthly_inputs JSONB NOT NULL,
  monthly_results JSONB NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_manning_created ON manning_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manning_project ON manning_calculations(project_name);
CREATE INDEX IF NOT EXISTS idx_flood_created ON flood_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flood_project ON flood_calculations(project_name);
CREATE INDEX IF NOT EXISTS idx_water_created ON water_balance_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_project ON water_balance_calculations(project_name);

-- Enable RLS
ALTER TABLE manning_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flood_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_balance_calculations ENABLE ROW LEVEL SECURITY;

-- Policies untuk akses publik
DROP POLICY IF EXISTS "Allow all for manning" ON manning_calculations;
DROP POLICY IF EXISTS "Allow all for flood" ON flood_calculations;
DROP POLICY IF EXISTS "Allow all for water" ON water_balance_calculations;

CREATE POLICY "Allow all for manning" ON manning_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for flood" ON flood_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for water" ON water_balance_calculations FOR ALL USING (true);


-- Tabel untuk Karakteristik DAS (Morfometri)
CREATE TABLE IF NOT EXISTS master_morfometri_das (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stasiun_id UUID REFERENCES master_stasiun(id) ON DELETE CASCADE,
  luas_das DECIMAL(12, 4) NOT NULL,
  panjang_sungai DECIMAL(12, 4),
  kemiringan_sungai DECIMAL(12, 6),
  elevasi DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stasiun_id)
);

-- Tabel untuk Tutupan Lahan
CREATE TABLE IF NOT EXISTS master_tutupan_lahan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stasiun_id UUID REFERENCES master_stasiun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL,
  luas DECIMAL(12, 4) NOT NULL,
  nilai_c DECIMAL(5, 3),
  nilai_cn DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Spatial Tables
ALTER TABLE master_morfometri_das ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tutupan_lahan ENABLE ROW LEVEL SECURITY;

-- Policies for Spatial Tables
DROP POLICY IF EXISTS "Allow all for morfometri" ON master_morfometri_das;
DROP POLICY IF EXISTS "Allow all for tutupan" ON master_tutupan_lahan;
CREATE POLICY "Allow all for morfometri" ON master_morfometri_das FOR ALL USING (true);
CREATE POLICY "Allow all for tutupan" ON master_tutupan_lahan FOR ALL USING (true);