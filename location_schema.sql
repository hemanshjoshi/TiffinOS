-- 11️⃣ SERVICE ZONES & GEOFENCING
CREATE TABLE service_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_km DECIMAL(5, 2) NOT NULL, -- Simplified circle geofencing
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link kitchens to zones (optional, or use coordinates)
ALTER TABLE kitchens ADD COLUMN IF NOT EXISTS service_radius_km DECIMAL(5, 2) DEFAULT 5.0;

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    dist DECIMAL;
BEGIN
    dist := 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) *
        cos(radians(lon2) - radians(lon1)) +
        sin(radians(lat1)) * sin(radians(lat2))
    );
    RETURN dist;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a location is within any active service zone
CREATE OR REPLACE FUNCTION is_location_serviceable(user_lat DECIMAL, user_lng DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    zone_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO zone_count
    FROM service_zones
    WHERE is_active = TRUE
    AND calculate_distance(user_lat, user_lng, center_lat, center_lng) <= radius_km;
    
    RETURN zone_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Updated search function to only include kitchens within their service radius
CREATE OR REPLACE FUNCTION get_nearby_kitchens(user_lat DECIMAL, user_lng DECIMAL)
RETURNS TABLE (
  id UUID,
  kitchen_name TEXT,
  maa_name TEXT,
  rating DECIMAL,
  image_url TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.kitchen_name,
    k.maa_name,
    k.rating,
    k.profile_image_url as image_url,
    calculate_distance(user_lat, user_lng, k.location_lat, k.location_lng) as dist
  FROM kitchens k
  WHERE k.is_active = TRUE
  AND calculate_distance(user_lat, user_lng, k.location_lat, k.location_lng) <= k.service_radius_km
  ORDER BY dist ASC;
END;
$$ LANGUAGE plpgsql;
