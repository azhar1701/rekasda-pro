-- Migration: Permissive CRUD (Disable RLS for Development/Ease of Use)
-- Date: 2026-03-17
-- Focus: Disabling Row Level Security to allow unrestricted CRUD

-- 1. Disable RLS on Master Tables
ALTER TABLE public.master_stasiun DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_data_hujan DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on Calculation Tables
ALTER TABLE public.calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.embung_projects DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on other associated tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'manning_calculations') THEN
        ALTER TABLE public.manning_calculations DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_profiles') THEN
        -- Keep RLS on user_profiles enabled but with permissive policies if needed, 
        -- but as requested to "remove users from db", we can disable RLS here too 
        -- while keeping the table for structure.
        ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
        ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Create "Allow All" policies as a backup for when RLS is accidentally re-enabled
-- This ensures that even if RLS is on, everyone can do everything.

DROP POLICY IF EXISTS "allow_all_master_stasiun" ON public.master_stasiun;
CREATE POLICY "allow_all_master_stasiun" ON public.master_stasiun FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_master_data_hujan" ON public.master_data_hujan;
CREATE POLICY "allow_all_master_data_hujan" ON public.master_data_hujan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_calculations" ON public.calculations;
CREATE POLICY "allow_all_calculations" ON public.calculations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_embung_projects" ON public.embung_projects;
CREATE POLICY "allow_all_embung_projects" ON public.embung_projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Final Audit Log for this change
INSERT INTO public.audit_logs (table_name, operation, new_data)
VALUES ('database', 'UPDATE', '{"note": "Disabled RLS globally for free CRUD access"}');
