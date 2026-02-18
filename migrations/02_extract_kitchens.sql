-- Migration to extract kitchen data from users table into a separate kitchens table

BEGIN;

-- 1. Ensure 'kitchens' table exists (referencing db_schema.sql)
CREATE TABLE IF NOT EXISTS public.kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Use user_id for now to keep links working if possible? Or let it generate and link owner_id?
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  kitchen_name TEXT NOT NULL,
  maa_name TEXT, -- From profiles?
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
  verification_date TIMESTAMPTZ,
  fssai_license TEXT,
  maakhana_trust_score INTEGER DEFAULT 100,
  commission_rate DECIMAL(4, 2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate data from 'users' (which was 'profiles') to 'kitchens'
-- Assuming 'kitchen_name' column exists in users from the old profiles table
DO $$
BEGIN
    -- Check if users table has kitchen_name column (indicating mixed data)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kitchen_name') THEN
        
        -- Insert into kitchens
        -- We try to use the SAME ID as user_id for the kitchen_id to preserve existing links if possible, 
        -- but kitchens.id is primary key. If we insert with id=user_id, it works if UUIDs don't collide.
        INSERT INTO public.kitchens (
            id, owner_id, kitchen_name, profile_image_url, rating, is_active, address, created_at, updated_at
        )
        SELECT 
            id, -- Use user_id as kitchen_id to keep links working
            id, -- owner_id is also user_id
            kitchen_name, 
            profile_photo_url, -- Map photo
            COALESCE(rating, 5.0), 
            COALESCE(is_active, true), 
            address,
            created_at, 
            updated_at
        FROM public.users
        WHERE kitchen_name IS NOT NULL
        ON CONFLICT (id) DO UPDATE SET
            kitchen_name = EXCLUDED.kitchen_name,
            profile_image_url = EXCLUDED.profile_image_url,
            rating = EXCLUDED.rating,
            is_active = EXCLUDED.is_active,
            address = EXCLUDED.address,
            updated_at = NOW();

    END IF;
END $$;

-- 3. Update Search Function to use 'kitchens' and 'menu_items' correctly
-- Replaces 'search_global' from search_optimization.sql

CREATE OR REPLACE FUNCTION search_global(search_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  kitchen_results JSONB;
  item_results JSONB;
BEGIN
  -- Search Kitchens
  SELECT jsonb_agg(t) INTO kitchen_results FROM (
    SELECT 
      k.id, 
      k.kitchen_name as name, 
      k.profile_image_url as image,
      k.rating,
      'kitchen' as type,
      ts_rank(
        setweight(to_tsvector('english', coalesce(k.kitchen_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(k.short_bio, '')), 'B'),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM kitchens k
    WHERE 
      k.is_active = TRUE
      AND (
        k.kitchen_name ILIKE '%' || search_query || '%'
        OR k.short_bio ILIKE '%' || search_query || '%'
      )
    ORDER BY rank DESC
    LIMIT 5
  ) t;

  -- Search Menu Items
  SELECT jsonb_agg(t) INTO item_results FROM (
    SELECT 
      m.id, 
      m.name, 
      m.price,
      m.image_url as image,
      m.kitchen_id,
      k.kitchen_name,
      'dish' as type,
      ts_rank(
        setweight(to_tsvector('english', coalesce(m.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(m.description, '')), 'B'),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM menu_items m
    JOIN kitchens k ON m.kitchen_id = k.id
    WHERE 
      m.is_available = TRUE 
      AND k.is_active = TRUE
      AND (
        m.name ILIKE '%' || search_query || '%'
        OR m.description ILIKE '%' || search_query || '%'
      )
    ORDER BY rank DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'kitchens', COALESCE(kitchen_results, '[]'::jsonb),
    'dishes', COALESCE(item_results, '[]'::jsonb)
  );
END;
$$;

COMMIT;
