-- ============================================================================
-- PRODUCTION-GRADE RLS SECURITY CONFIGURATION
-- FASE 1: Keamanan Data & Validitas Kalkulasi
-- Date: 2026-02-26
-- Standard: Enterprise Security Best Practices
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER PROFILES TABLE (Role-Based Access Control)
-- ============================================================================

-- Create user profiles table for role management
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'engineer')),
    organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

-- ============================================================================
-- SECTION 2: CALCULATIONS TABLE (User-Owned Data)
-- ============================================================================

-- Ensure user_id column exists
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.calculations;
DROP POLICY IF EXISTS "Users can only see their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can only insert their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can only update their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can only delete their own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Anonymous users can view public calculations" ON public.calculations;

-- Policy: Authenticated users can SELECT their own data
CREATE POLICY "auth_select_own_calculations" ON public.calculations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Authenticated users can INSERT their own data
CREATE POLICY "auth_insert_own_calculations" ON public.calculations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can UPDATE their own data
CREATE POLICY "auth_update_own_calculations" ON public.calculations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can DELETE their own data
CREATE POLICY "auth_delete_own_calculations" ON public.calculations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Anonymous users can view public pilot data (user_id IS NULL)
CREATE POLICY "anon_select_public_calculations" ON public.calculations
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- ============================================================================
-- SECTION 3: MASTER_STASIUN (Read-Only for Users, Write for Admins)
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users on master_stasiun" ON public.master_stasiun;

-- Policy: All authenticated users can READ
CREATE POLICY "auth_select_master_stasiun" ON public.master_stasiun
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can INSERT
CREATE POLICY "admin_insert_master_stasiun" ON public.master_stasiun
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can UPDATE
CREATE POLICY "admin_update_master_stasiun" ON public.master_stasiun
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can DELETE
CREATE POLICY "admin_delete_master_stasiun" ON public.master_stasiun
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SECTION 4: MASTER_DATA_HUJAN (Read-Only for Users, Write for Admins)
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users on master_data_hujan" ON public.master_data_hujan;

-- Policy: All authenticated users can READ
CREATE POLICY "auth_select_master_data_hujan" ON public.master_data_hujan
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can INSERT
CREATE POLICY "admin_insert_master_data_hujan" ON public.master_data_hujan
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can UPDATE
CREATE POLICY "admin_update_master_data_hujan" ON public.master_data_hujan
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Only admins can DELETE
CREATE POLICY "admin_delete_master_data_hujan" ON public.master_data_hujan
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SECTION 5: PARAMETER_DAS (If exists - Read-Only for Users, Write for Admins)
-- ============================================================================

-- Check if parameter_das table exists, if so, apply RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parameter_das') THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.parameter_das ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users on parameter_das" ON public.parameter_das';
        
        -- Policy: All authenticated users can READ
        EXECUTE 'CREATE POLICY "auth_select_parameter_das" ON public.parameter_das
            FOR SELECT
            TO authenticated
            USING (true)';
        
        -- Policy: Only admins can INSERT
        EXECUTE 'CREATE POLICY "admin_insert_parameter_das" ON public.parameter_das
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )';
        
        -- Policy: Only admins can UPDATE
        EXECUTE 'CREATE POLICY "admin_update_parameter_das" ON public.parameter_das
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )';
        
        -- Policy: Only admins can DELETE
        EXECUTE 'CREATE POLICY "admin_delete_parameter_das" ON public.parameter_das
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )';
    END IF;
END $$;

-- ============================================================================
-- SECTION 6: AUDIT LOGGING (Optional but Recommended)
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs (only admins can read)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_audit_logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify RLS is working)
-- ============================================================================

-- Uncomment to verify RLS status:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
