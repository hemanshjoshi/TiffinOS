-- 1️⃣ REVIEWS TABLE
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ FAVORITES TABLE
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, kitchen_id)
);

-- 3️⃣ UPDATE KITCHEN RATING FUNCTION (Trigger)
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

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_kitchen_rating();

-- 4️⃣ SECURITY POLICIES (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
