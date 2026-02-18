-- Enable pg_trgm for fuzzy matching if not enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Add Search Vector to PROFILES (Kitchens)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows
UPDATE profiles 
SET search_vector = (
    setweight(to_tsvector('english', coalesce(kitchen_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(full_name, '')), 'B') || -- Using full_name as backup or chef name?
    setweight(to_tsvector('english', coalesce(food_preference, '')), 'C')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);

-- Trigger to auto-update
CREATE OR REPLACE FUNCTION profiles_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.kitchen_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.full_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.food_preference, '')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate_profiles ON profiles;
CREATE TRIGGER tsvectorupdate_profiles BEFORE INSERT OR UPDATE
    ON profiles FOR EACH ROW EXECUTE PROCEDURE profiles_search_trigger();


-- 2. Add Search Vector to Menu Items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows
UPDATE menu_items 
SET search_vector = (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_menu_items_search ON menu_items USING GIN(search_vector);

-- Trigger
CREATE OR REPLACE FUNCTION menu_items_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate_menu_items ON menu_items;
CREATE TRIGGER tsvectorupdate_menu_items BEFORE INSERT OR UPDATE
    ON menu_items FOR EACH ROW EXECUTE PROCEDURE menu_items_search_trigger();


-- 3. Unified Search Function
CREATE OR REPLACE FUNCTION search_global(search_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  kitchen_results JSONB;
  item_results JSONB;
BEGIN
  -- Search Kitchens (Profiles)
  SELECT jsonb_agg(t) INTO kitchen_results FROM (
    SELECT 
      id, 
      kitchen_name as name, 
      profile_image_url as image,
      -- rating might not exist in profiles schema I saw earlier, checking fallback
      -- app/search/results.tsx uses item.rating || '4.0'. So it might be missing or null.
      -- Let's try to select it if it exists, else NULL.
      -- But SELECT * would work if column exists. Explicitly selecting safer common columns.
      profile_photo_url, -- Duplicate of image?
      'kitchen' as type,
      ts_rank(search_vector, plainto_tsquery('english', search_query)) as rank
    FROM profiles
    WHERE 
      -- Check if it's a kitchen? Maybe user_type check? Or kitchen_name is not null?
      kitchen_name IS NOT NULL
      AND (
        search_vector @@ plainto_tsquery('english', search_query)
        OR kitchen_name ILIKE '%' || search_query || '%' -- Fallback
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
      p.kitchen_name,
      'dish' as type,
      ts_rank(m.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM menu_items m
    JOIN profiles p ON m.kitchen_id = p.id
    WHERE 
      m.is_available = TRUE 
      AND p.kitchen_name IS NOT NULL -- Ensure it's a valid kitchen
      AND (
        m.search_vector @@ plainto_tsquery('english', search_query)
        OR m.name ILIKE '%' || search_query || '%'
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
