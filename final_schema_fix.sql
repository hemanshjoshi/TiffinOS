-- 1️⃣ Ensure tables exist
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, kitchen_id)
);

-- 2️⃣ Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Orders policies
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- Order Items policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
  )
);

-- Favorites policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
CREATE POLICY "Users can manage their own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public Read Favorites" ON favorites;
CREATE POLICY "Public Read Favorites" ON favorites FOR SELECT USING (true);

-- Reviews policies
DROP POLICY IF EXISTS "Public Read Reviews" ON reviews;
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON reviews;
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3️⃣ Rating trigger (in case not present)
CREATE OR REPLACE FUNCTION update_kitchen_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kitchens
  SET 
    rating = (SELECT AVG(rating) FROM reviews WHERE kitchen_id = NEW.kitchen_id),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE kitchen_id = NEW.kitchen_id)
  WHERE id = NEW.kitchen_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_kitchen_rating();
