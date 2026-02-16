-- Secure RPC function to check if a phone number exists
-- Returns TRUE if exists, FALSE otherwise
-- Used to prevent "Unique Constraint" errors in setup-profile

CREATE OR REPLACE FUNCTION check_if_phone_exists(phone_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Normalize inputs if needed, but assuming exact match for now
  -- The app sends E.164 format (+91...)
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE mobile_number = phone_check
    AND id != auth.uid() -- Don't count the current user if they already have it (updatable)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
