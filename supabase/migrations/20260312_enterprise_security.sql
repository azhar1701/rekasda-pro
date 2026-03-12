-- Enterprise Security Hardening Migration
-- Date: 2026-03-12
-- Focus: Row Level Security (RLS) for Rainfall Master Data

-- 1. Hardening master_stasiun
ALTER TABLE public.master_stasiun ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_master_stasiun_user_id ON public.master_stasiun(user_id);

ALTER TABLE public.master_stasiun ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.master_stasiun;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.master_stasiun;

CREATE POLICY "Users can manage their own stations" ON public.master_stasiun
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public stations" ON public.master_stasiun
  FOR SELECT TO anon, authenticated
  USING (user_id IS NULL);

-- 2. Hardening master_data_hujan
ALTER TABLE public.master_data_hujan ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_master_data_hujan_user_id ON public.master_data_hujan(user_id);

ALTER TABLE public.master_data_hujan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.master_data_hujan;

CREATE POLICY "Users can manage their own rainfall data" ON public.master_data_hujan
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public rainfall data" ON public.master_data_hujan
  FOR SELECT TO anon, authenticated
  USING (user_id IS NULL);

-- 3. Hardening other calculation tables (Cleanup)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'manning_calculations') THEN
        ALTER TABLE manning_calculations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;
        ALTER TABLE manning_calculations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all for manning" ON manning_calculations;
        CREATE POLICY "Users can manage their own manning" ON manning_calculations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Public view manning" ON manning_calculations FOR SELECT TO anon, authenticated USING (user_id IS NULL);
    END IF;
END $$;
