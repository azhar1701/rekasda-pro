-- Add metadata columns for Data Quality and Infilling
-- Date: 2026-03-12

ALTER TABLE public.master_data_hujan 
ADD COLUMN IF NOT EXISTS is_infilled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS infilled_from TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS anomaly_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS keterangan TEXT DEFAULT NULL;

-- Index for filtering by anomaly
CREATE INDEX IF NOT EXISTS idx_master_data_hujan_anomaly ON public.master_data_hujan(anomaly_type) WHERE anomaly_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_master_data_hujan_infilled ON public.master_data_hujan(is_infilled) WHERE is_infilled = TRUE;
