-- Drop constraints first
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE kitchens DROP CONSTRAINT IF EXISTS kitchens_owner_id_fkey;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_kitchen_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_kitchen_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Now drop tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS kitchens;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;

-- Recreate schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 4️⃣ ADDRESS MANAGEMENT
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

-- Indexes for Performance
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_lat_long ON addresses(latitude, longitude);

-- 1️⃣2️⃣ AUDIT LOGS (Compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchens
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
  is_active BOOLEAN DEFAULT TRUE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address TEXT,
  tags TEXT[],
  verification_date TIMESTAMP WITH TIME ZONE,
  fssai_license TEXT,
  maakhana_trust_score INTEGER DEFAULT 100,
  commission_rate DECIMAL(4, 2) DEFAULT 10.00
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id UUID REFERENCES kitchens(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  variants JSONB,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  kitchen_id UUID REFERENCES kitchens(id),
  status TEXT CHECK (status IN ('Pending', 'Confirmed', 'Cooking', 'Packed', 'Picked', 'Delivered', 'Cancelled')),
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

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  selected_variant JSONB,
  selected_addons JSONB
);
