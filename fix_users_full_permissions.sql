-- Comprehensive Fix for Users Table Permissions
-- Run this in Supabase SQL Editor to fix the "row-level security" error completely.

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to authenticated users
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- 3. Cleanup existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- 4. Re-create Policies

-- Allow users to see their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile
-- This is the critical one for new sign-ups
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

COMMIT;
