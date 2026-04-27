-- Fix Addresses RLS Policies - Relaxed Version for Troubleshooting

-- 1. Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to INSERT addresses (relaxed check)
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Authenticated can insert addresses" ON addresses;
CREATE POLICY "Authenticated can insert addresses" ON addresses 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow users to SELECT their own addresses
DROP POLICY IF EXISTS "Users can read own addresses" ON addresses;
CREATE POLICY "Users can read own addresses" ON addresses 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Allow users to UPDATE their own addresses
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses" ON addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Allow users to DELETE their own addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Authenticated can delete addresses" ON addresses;
CREATE POLICY "Authenticated can delete addresses" ON addresses 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- 6. Grant permissions (just in case)
GRANT ALL ON TABLE addresses TO authenticated;
-- No sequence grant needed for UUID
