-- Migration: Revoke Permissive CRUD & Enforce Strict RBAC
-- Date: 2026-03-24
-- Focus: Re-enabling RLS globally and fixing unauthenticated/unauthorized CRUD access

-- 1. Re-Enable RLS on Master Tables & Analytics
ALTER TABLE public.master_stasiun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_data_hujan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embung_projects ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'manning_calculations') THEN
        ALTER TABLE public.manning_calculations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_profiles') THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Remove dangerous "Allow All" policies from previous misconfiguration
DROP POLICY IF EXISTS "allow_all_master_stasiun" ON public.master_stasiun;
DROP POLICY IF EXISTS "allow_all_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "allow_all_calculations" ON public.calculations;
DROP POLICY IF EXISTS "allow_all_embung_projects" ON public.embung_projects;

-- 3. Create Restrictive Policies

-- 3A: master_stasiun
CREATE POLICY "view_stasiun_authenticated" ON public.master_stasiun FOR SELECT TO authenticated USING (true);
CREATE POLICY "modify_stasiun_restricted" ON public.master_stasiun
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
    );

-- 3B: master_data_hujan
CREATE POLICY "view_data_hujan_authenticated" ON public.master_data_hujan FOR SELECT TO authenticated USING (true);
CREATE POLICY "modify_data_hujan_restricted" ON public.master_data_hujan
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
    );

-- 3C: calculations
CREATE POLICY "view_calculations_authenticated" ON public.calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "modify_calculations_restricted" ON public.calculations
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
    );

-- 3D: embung_projects
CREATE POLICY "view_embung_authenticated" ON public.embung_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "modify_embung_restricted" ON public.embung_projects
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
    );

-- 4. Final Audit Log
-- Note: Insert might bypass policies temporarily depending on privileges, but as superuser during migration it's fine.
INSERT INTO public.audit_logs (table_name, operation, new_data)
VALUES ('database_security', 'UPDATE', '{"status": "SECURED", "note": "Re-enabled RLS and secured endpoints against unauthorized modifications."}');
