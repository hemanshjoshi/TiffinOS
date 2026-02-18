-- Migration to consolidate profiles into users table

BEGIN;

-- 1. If 'profiles' table exists and 'users' does NOT, rename profiles to users.
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE public.profiles RENAME TO users;
    END IF;
END $$;

-- 2. Ensure 'users' table exists (if it didn't exist and profiles didn't exist)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  mobile_number TEXT UNIQUE,
  email TEXT,
  profile_photo_url TEXT,
  food_preference TEXT DEFAULT 'None',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. If both tables existed (unlikely but possible), migrate data from profiles to users
-- This part is tricky without knowing exact columns, but we'll assume standard columns
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Copy data where id doesn't exist in users
        INSERT INTO public.users (id, full_name, mobile_number, email, profile_photo_url, food_preference, created_at, updated_at)
        SELECT id, full_name, mobile_number, email, profile_photo_url, food_preference, created_at, updated_at
        FROM public.profiles
        ON CONFLICT (id) DO NOTHING;
        
        -- We won't drop profiles yet, just in case, but we will stop using it.
        -- ALTER TABLE public.profiles RENAME TO profiles_backup; 
    END IF;
END $$;

-- 4. Add missing columns to 'users' if they don't exist (referencing db_schema.sql structure)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('CUSTOMER', 'KITCHEN_PARTNER', 'DELIVERY_PARTNER')) DEFAULT 'CUSTOMER',
ADD COLUMN IF NOT EXISTS account_status TEXT CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS device_metadata JSONB,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb;

-- 5. Fix Foreign Keys in other tables to point to 'users'

-- Addresses
DO $$ BEGIN
    -- Check if constraint exists pointing to profiles
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'addresses_user_id_fkey' AND table_name = 'addresses') THEN
        ALTER TABLE public.addresses DROP CONSTRAINT addresses_user_id_fkey;
    END IF;
    
    -- Add constraint pointing to users
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'addresses_user_id_fkey_users' AND table_name = 'addresses') THEN
        ALTER TABLE public.addresses ADD CONSTRAINT addresses_user_id_fkey_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Orders
DO $$ BEGIN
    -- Check if constraint exists pointing to profiles
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_user_id_fkey' AND table_name = 'orders') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_fkey;
    END IF;
    
    -- Add constraint pointing to users
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_user_id_fkey_users' AND table_name = 'orders') THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Order Items (if it has user_id)
DO $$ BEGIN
    -- Check if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='user_id') THEN
        -- Check constraint
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'order_items_user_id_fkey' AND table_name = 'order_items') THEN
             ALTER TABLE public.order_items DROP CONSTRAINT order_items_user_id_fkey;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'order_items_user_id_fkey_users' AND table_name = 'order_items') THEN
             ALTER TABLE public.order_items ADD CONSTRAINT order_items_user_id_fkey_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 6. Update RLS Policies for 'users'
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;
