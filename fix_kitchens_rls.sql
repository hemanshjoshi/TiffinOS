-- Secure RLS policies for Kitchens and Menu Items

-- Enable RLS
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop loose policies
DROP POLICY IF EXISTS "Public Read Kitchens" ON kitchens;
DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;

-- Create Secure Read Policy for Kitchens
-- We want to allow public reading but ideally restrict columns. 
-- In Supabase, RLS applies to rows. To restrict columns, we use Views or explicit column lists in SELECT if possible, 
-- but RLS usually just controls which rows are visible.
-- However, we can use a VIEW for public consumption if we want to be very strict.
-- For now, let's ensure only ACTIVE kitchens are visible.
CREATE POLICY "Public Read Active Kitchens" ON kitchens 
FOR SELECT USING (is_active = TRUE AND is_verified = TRUE);

-- Create Secure Read Policy for Menu Items
CREATE POLICY "Public Read Available Menu Items" ON menu_items 
FOR SELECT USING (is_available = TRUE);

-- Restrict sensitive columns via a VIEW (optional but recommended)
-- Since I can't easily change the app code to point to a view right now, 
-- I will at least ensure that the commission_rate cannot be UPDATED by anyone but admins.
-- The audit says "exposes sensitive fields like commission_rate... to anyone with the API key."
-- Actually, SELECT * will always return all columns allowed by the policy.

-- To truly hide columns from anon, we should revoke SELECT on those columns for the anon role.
REVOKE SELECT (commission_rate, owner_id, fssai_license) ON kitchens FROM anon;
GRANT SELECT (id, kitchen_name, maa_name, short_bio, profile_image_url, cover_image_url, rating, rating_count, is_verified, is_active, location_lat, location_lng, address, tags, verification_date, maakhana_trust_score) ON kitchens TO anon;
GRANT SELECT (id, kitchen_name, maa_name, short_bio, profile_image_url, cover_image_url, rating, rating_count, is_verified, is_active, location_lat, location_lng, address, tags, verification_date, maakhana_trust_score, commission_rate, owner_id, fssai_license) ON kitchens TO authenticated;

-- Ensure Menu Items are also restricted if needed
GRANT SELECT ON menu_items TO anon, authenticated;
