-- Migration: Consolidate Delete Policy for Rainfall Data
-- Date: 2026-03-17
-- Standard: Enhanced Workflow Permissions & Helper Consolidation

-- 1. Create robust helper functions (SECURITY DEFINER to bypass RLS on user_profiles)
CREATE OR REPLACE FUNCTION public.is_engineer_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'engineer')
    );
END;
$$;

-- 2. Drop all known variations of delete policies on master_data_hujan
DROP POLICY IF EXISTS "admin_delete_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "hujan_admin_delete" ON public.master_data_hujan;
DROP POLICY IF EXISTS "admin_engineer_delete_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "auth_delete_master_data_hujan" ON public.master_data_hujan;

-- 3. Create the new consolidated policy
CREATE POLICY "master_data_hujan_delete_policy" 
    ON public.master_data_hujan
    FOR DELETE
    TO authenticated
    USING (public.is_engineer_or_admin());

-- 4. Log the audit
INSERT INTO public.audit_logs (table_name, operation, new_data)
VALUES ('master_data_hujan', 'UPDATE', '{"note": "Consolidated delete policy using is_engineer_or_admin helper"}');
