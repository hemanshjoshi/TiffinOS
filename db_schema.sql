-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For Fuzzy Search

-- Cleanup Old Tables
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS delivery_profiles CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS master_menu_items CASCADE;
DROP TABLE IF EXISTS kitchens CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1️⃣ USER ACCOUNT CORE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  mobile_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  profile_photo_url TEXT,
  user_type TEXT CHECK (user_type IN ('CUSTOMER', 'KITCHEN_PARTNER', 'DELIVERY_PARTNER')) DEFAULT 'CUSTOMER',
  account_status TEXT CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  device_metadata JSONB,
  referral_code TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  food_preference TEXT CHECK (food_preference IN ('Veg', 'Non-Veg', 'Jain', 'Satvik'))
);

-- 2️⃣ DELIVERY PROFILES (For Drivers)
CREATE TABLE delivery_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT CHECK (vehicle_type IN ('BIKE', 'SCOOTER', 'CYCLE', 'WALKER')),
  vehicle_number TEXT,
  driving_license_number TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ ADDRESS MANAGEMENT
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label TEXT CHECK (label IN ('HOME', 'WORK', 'OTHER')) DEFAULT 'HOME',
  custom_label TEXT,
  house_flat_no TEXT NOT NULL,
  building_society TEXT,
  street_area TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_lat_long ON addresses(latitude, longitude);

-- 4️⃣ KITCHENS (Partner Profiles)
CREATE TABLE kitchens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id),
  kitchen_name TEXT NOT NULL,
  maa_name TEXT NOT NULL,
  short_bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE, -- Kitchen ON/OFF Toggle
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address TEXT,
  tags TEXT[],
  verification_date TIMESTAMP WITH TIME ZONE,
  fssai_license TEXT,
  maakhana_trust_score INTEGER DEFAULT 100,
  commission_rate DECIMAL(4, 2) DEFAULT 10.00
);

-- 5️⃣ MASTER MENU INDEX (Standardized Items)
CREATE TABLE master_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Standardized Name (e.g., "Matar Paneer")
  category TEXT NOT NULL, -- Main Course, Starter, etc.
  description TEXT, -- Generic description
  default_image_url TEXT, -- Placeholder if mother has no image
  tags TEXT[], -- Veg, Spicy, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6️⃣ KITCHEN MENU ITEMS (Specific Offerings)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id UUID REFERENCES kitchens(id),
  master_item_id UUID REFERENCES master_menu_items(id), -- Link to Master
  name TEXT, -- Optional override or cached name
  description TEXT, -- Specific description (e.g., "My special recipe")
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT, -- Authentic Mother's Photo
  is_available BOOLEAN DEFAULT TRUE, -- Item ON/OFF
  tags TEXT[],
  variants JSONB,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7️⃣ ORDERS (Unified)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id), -- Customer
  kitchen_id UUID REFERENCES kitchens(id), -- Partner
  delivery_partner_id UUID REFERENCES users(id), -- Driver (New Field)
  status TEXT CHECK (status IN ('Pending', 'Confirmed', 'Cooking', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  item_total DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  platform_fee DECIMAL(10, 2) DEFAULT 0.00,
  taxes DECIMAL(10, 2) DEFAULT 0.00,
  tip_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  delivery_address_snapshot JSONB NOT NULL, 
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8️⃣ ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  selected_variant JSONB,
  selected_addons JSONB
);

-- 9️⃣ COUPONS
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('PERCENTAGE', 'FLAT')) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2) DEFAULT 0.00,
  max_discount DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  kitchen_id UUID REFERENCES kitchens(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔟 PAYOUTS (Earnings)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id), -- Can be Kitchen or Driver
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT CHECK (type IN ('KITCHEN_EARNING', 'DELIVERY_EARNING')),
  status TEXT CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 🛡️ SECURITY & PERMISSIONS (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Grant access to public (anon) and logged in users (authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Policies (Simplified for Dev - Production should be stricter)

-- Public Tables (Read Only for everyone)
CREATE POLICY "Public Read Kitchens" ON kitchens FOR SELECT USING (true);
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public Read Master Menu" ON master_menu_items FOR SELECT USING (true);
CREATE POLICY "Public Read Coupons" ON coupons FOR SELECT USING (true);

-- Users (Read Own)
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);

-- ⚠️ DEMO MODE POLICIES (Allow Updates for Testing)
-- In production, these should be restricted to auth.uid() = owner_id
CREATE POLICY "Demo Update Kitchens" ON kitchens FOR UPDATE USING (true);
CREATE POLICY "Demo Update Menu" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Demo Insert Menu" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo Update Orders" ON orders FOR UPDATE USING (true);

-- SEARCH FUNCTION (RPC)
CREATE OR REPLACE FUNCTION search_menu_items(search_query TEXT)
RETURNS TABLE (
  menu_item_id UUID,
  kitchen_id UUID,
  name TEXT,
  price DECIMAL,
  image_url TEXT,
  similarity REAL
) AS $$
BEGIN
  -- Perform search with relaxed fuzzy matching
  RETURN QUERY
  SELECT 
    mi.id as menu_item_id,
    mi.kitchen_id,
    mmi.name,
    mi.price,
    mi.image_url,
    similarity(mmi.name, search_query) as sim
  FROM menu_items mi
  JOIN master_menu_items mmi ON mi.master_item_id = mmi.id
  JOIN kitchens k ON mi.kitchen_id = k.id
  WHERE 
    mi.is_available = TRUE 
    AND k.is_active = TRUE -- Only show items from Active Kitchens
    AND (
        mmi.name ILIKE '%' || search_query || '%' -- Partial match
        OR similarity(mmi.name, search_query) > 0.3 -- Fuzzy match (Tuned)
        OR EXISTS (SELECT 1 FROM unnest(mmi.tags) t WHERE t ILIKE '%' || search_query || '%') -- Partial Tag match
    )
  ORDER BY sim DESC;
END;
$$ LANGUAGE plpgsql;
