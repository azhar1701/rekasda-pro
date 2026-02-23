-- Migration: Add user_id to calculations and harden RLS
-- Date: 2026-02-23

ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Create index for user-based filtering
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON calculations;

-- Policy: Authenticated users can only see their own data
CREATE POLICY "Users can only see their own calculations" ON calculations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own data
CREATE POLICY "Users can only insert their own calculations" ON calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can update their own data
CREATE POLICY "Users can only update their own calculations" ON calculations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own data
CREATE POLICY "Users can only delete their own calculations" ON calculations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow anonymous users to see public calculations (where user_id is null)
-- This allows the "Pilot Data" or initial samples to be visible
CREATE POLICY "Anonymous users can view public calculations" ON calculations
  FOR SELECT
  TO anon
  USING (user_id IS NULL);
