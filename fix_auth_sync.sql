-- 1. Relax Constraints to allow partial profiles (e.g. Google Sign-In without Phone)
ALTER TABLE users ALTER COLUMN mobile_number DROP NOT NULL;

-- 2. Create Trigger Function to Sync Auth -> Public Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    mobile_number, 
    full_name, 
    profile_photo_url,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    new.phone, -- Maps correctly for Phone Auth users
    new.raw_user_meta_data->>'full_name', -- Maps correctly for Google users
    new.raw_user_meta_data->>'avatar_url', -- Google profile picture
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    mobile_number = COALESCE(users.mobile_number, EXCLUDED.mobile_number),
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    profile_photo_url = COALESCE(users.profile_photo_url, EXCLUDED.profile_photo_url),
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Backfill existing auth users who might be missing in public.users (Optional safety net)
-- This part is tricky to run from SQL editor as it requires permissions on auth.users which might be restricted.
-- But the function above is SECURITY DEFINER so it can access it.
-- We won't auto-backfill here to avoid complex permission errors in this script, 
-- but the ON CONFLICT clause handles future "re-signups" or manual fixes.
