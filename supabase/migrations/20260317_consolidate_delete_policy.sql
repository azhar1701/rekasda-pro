-- Migration: Consolidate Delete Policy for Rainfall Data (V2)
-- Date: 2026-03-17
-- Standard: Enhanced Workflow Permissions & Helper Consolidation

-- 1. Create robust helper functions (SECURITY DEFINER to bypass RLS on user_profiles)
CREATE OR REPLACE FUNCTION public.is_engineer_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
    u_role TEXT;
BEGIN
    SELECT role INTO u_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN u_role IN ('admin', 'engineer');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 2. Drop all known variations of delete/all policies on master_data_hujan
DROP POLICY IF EXISTS "admin_delete_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "hujan_admin_delete" ON public.master_data_hujan;
DROP POLICY IF EXISTS "admin_engineer_delete_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "auth_delete_master_data_hujan" ON public.master_data_hujan;
DROP POLICY IF EXISTS "Users can manage their own rainfall data" ON public.master_data_hujan;

-- 3. Create the new consolidated policies
-- SELECT is already handled by "hujan_authenticated_select" or "Anyone can view public..."
-- We only consolidate DELETE here to fix the user's issue.

CREATE POLICY "master_data_hujan_delete_policy" 
    ON public.master_data_hujan
    FOR DELETE
    TO authenticated
    USING (public.is_engineer_or_admin());

-- Also add a policy for engineers to manage metadata if needed, 
-- but let's focus on DELETE first.

-- 4. Log the audit
INSERT INTO public.audit_logs (table_name, operation, new_data)
VALUES ('master_data_hujan', 'UPDATE', '{"note": "Consolidated delete policy using is_engineer_or_admin helper V2"}');
