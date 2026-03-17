-- Migration: Allow Engineers to Delete Rainfall Data
-- Date: 2026-03-16
-- Standard: Enhanced Workflow Permissions

-- Drop existing restricted delete policy
DROP POLICY IF EXISTS "admin_delete_master_data_hujan" ON public.master_data_hujan;

-- Create new inclusive delete policy for Admins and Engineers
CREATE POLICY "admin_engineer_delete_master_data_hujan" ON public.master_data_hujan
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'engineer')
        )
    );

-- Log this security update
INSERT INTO public.audit_logs (table_name, operation, new_data)
VALUES ('master_data_hujan', 'UPDATE', '{"note": "Updated delete policy to include engineers"}');
