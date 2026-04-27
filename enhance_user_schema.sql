-- Enhanced User Table Schema
-- Add more profile fields to the users table

-- Add missing profile fields to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb;

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Create storage bucket for profile pictures if it doesn't exist
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pics') THEN
      bucket_id = 'profile-pics'
    ELSE
      NULL
  END as create_bucket
FROM storage.buckets;

-- Create RLS policies for profile pictures storage
CREATE POLICY "Profile pictures are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pics');

CREATE POLICY "Users can upload their own profile picture" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-pics' AND auth.uid()::text = storage.foldername(name)
);

CREATE POLICY "Users can update their own profile picture" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-pics' AND auth.uid()::text = storage.foldername(name)
);

CREATE POLICY "Users can delete their own profile picture" ON storage.objects FOR DELETE USING (
  bucket_id = 'profile-pics' AND auth.uid()::text = storage.foldername(name)
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile_number ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
