-- Quick Fix: Allow Public Access to Kitchens and Menu Items

-- Enable RLS on tables
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Grant public access to schema and tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Read Kitchens" ON kitchens;
DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;

-- Create new public read policies
CREATE POLICY "Public Read Kitchens" ON kitchens FOR SELECT USING (true);
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);

-- Also fix users table (to avoid other errors)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
