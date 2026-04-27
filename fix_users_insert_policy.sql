-- Allow users to insert their own profile
-- This is necessary for sign-ups where the user record doesn't exist yet (e.g. Google Sign-In)

-- Enable RLS (just in case)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
