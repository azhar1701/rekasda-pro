-- =============================================================================
-- Migrasi: Penandaan Deret Data Hasil Koreksi Double Mass Curve (DMC)
-- RekasDA Pro — Platform Rekayasa Analisis SDA & Hidrologi (SNI Compliant)
-- =============================================================================

ALTER TABLE public.master_data_hujan
ADD COLUMN IF NOT EXISTS is_dmc_corrected BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.master_data_hujan.is_dmc_corrected IS 'Menandai record curah hujan harian yang telah dikoreksi menggunakan metode Kurva Massa Ganda (Double Mass Curve)';
