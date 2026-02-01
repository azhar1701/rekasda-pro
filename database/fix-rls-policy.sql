-- Fix RLS policies for calculations table
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON calculations;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON calculations;
DROP POLICY IF EXISTS "Allow all operations" ON calculations;

-- Create new policy that allows anonymous access
CREATE POLICY "Enable all operations for anonymous users" ON calculations
  FOR ALL 
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON calculations
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'calculations';