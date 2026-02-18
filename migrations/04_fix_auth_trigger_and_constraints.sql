-- Fix Auth Trigger and User Constraints to prevent Signup errors

BEGIN;

-- 1. Ensure mobile_number allows NULLs (critical for email signups if phone not provided in auth core)
ALTER TABLE public.users ALTER COLUMN mobile_number DROP NOT NULL;

-- 2. Update the Trigger Function to use metadata
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
    -- Prefer auth.users.phone, fallback to metadata (what signup.tsx sends)
    COALESCE(new.phone, new.raw_user_meta_data->>'mobile_number'), 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    mobile_number = COALESCE(public.users.mobile_number, EXCLUDED.mobile_number),
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    profile_photo_url = COALESCE(public.users.profile_photo_url, EXCLUDED.profile_photo_url),
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
