-- =============================================================================
-- Migration: Embung (Reservoir) Projects Table
-- Modul Manajemen Situ & Embung
-- =============================================================================

-- Tabel untuk proyek Embung/Situ
CREATE TABLE IF NOT EXISTS embung_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  -- Tipe analisis: capacity, routing, water_balance, sedimentation
  analysis_type VARCHAR(50) NOT NULL DEFAULT 'capacity',
  -- Input dan hasil disimpan sebagai JSONB agar fleksibel
  input_data JSONB NOT NULL DEFAULT '{}',
  result_data JSONB NOT NULL DEFAULT '{}',
  -- Kurva lengkung kapasitas (Stage-Storage-Area-Discharge)
  curve_data JSONB DEFAULT NULL,
  -- Metadata
  location JSONB DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_embung_created ON embung_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_embung_project ON embung_projects(project_name);
CREATE INDEX IF NOT EXISTS idx_embung_type ON embung_projects(analysis_type);

-- Enable RLS
ALTER TABLE embung_projects ENABLE ROW LEVEL SECURITY;

-- Policy: allow all (same pattern as other tables)
DROP POLICY IF EXISTS "Allow all for embung" ON embung_projects;
CREATE POLICY "Allow all for embung" ON embung_projects FOR ALL USING (true);
