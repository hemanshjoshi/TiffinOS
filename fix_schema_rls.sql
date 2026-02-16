-- Fix RLS Policies for Public Access

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Grant access to public (anon) and logged in users (authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Public Tables (Read Only for everyone)
DROP POLICY IF EXISTS "Public Read Kitchens" ON kitchens;
CREATE POLICY "Public Read Kitchens" ON kitchens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);

-- Allow users to read their own data
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to read addresses
DROP POLICY IF EXISTS "Authenticated can read addresses" ON addresses;
CREATE POLICY "Authenticated can read addresses" ON addresses FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert orders (customers)
DROP POLICY IF EXISTS "Authenticated can insert orders" ON orders;
CREATE POLICY "Authenticated can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own orders
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to read order items for their orders
DROP POLICY IF EXISTS "Users can read order items" ON order_items;
CREATE POLICY "Users can read order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- Demo Mode Policies (Allow Updates for Testing)
CREATE POLICY "Demo Update Kitchens" ON kitchens FOR UPDATE USING (true);
CREATE POLICY "Demo Update Menu" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Demo Insert Menu" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo Update Orders" ON orders FOR UPDATE USING (true);
