-- 1. Ensure 'users' table exists as the single source of truth (Consolidating 'profiles')
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to Auth
  full_name TEXT,
  mobile_number TEXT UNIQUE, -- Allow NULL initially if signup via email only, but app enforces it
  email TEXT UNIQUE,
  profile_photo_url TEXT,
  user_type TEXT CHECK (user_type IN ('CUSTOMER', 'KITCHEN_PARTNER', 'DELIVERY_PARTNER')) DEFAULT 'CUSTOMER',
  account_status TEXT CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  device_metadata JSONB,
  referral_code TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  food_preference TEXT CHECK (food_preference IN ('Veg', 'Non-Veg', 'Jain', 'Satvik')) DEFAULT 'Veg'
);

-- 2. Migrate data from 'profiles' to 'users' if 'profiles' exists and 'users' is empty
-- Using dynamic SQL to avoid compilation errors if 'profiles' doesn't exist or columns are missing
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN

        -- Check if 'full_name' exists in profiles before referencing it
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') INTO column_exists;

        IF column_exists THEN
            -- Safe to migrate if column exists
            INSERT INTO public.users (id, full_name, mobile_number, email, profile_photo_url, created_at, updated_at)
            SELECT id, full_name, mobile_number, email, profile_photo_url, created_at, updated_at
            FROM public.profiles
            ON CONFLICT (id) DO NOTHING;
        ELSE
            -- Fallback if column name differs (though supabase_schema.sql says it is full_name)
            -- Just migrates ID and timestamps if names are broken
            INSERT INTO public.users (id, created_at, updated_at)
            SELECT id, created_at, updated_at
            FROM public.profiles
            ON CONFLICT (id) DO NOTHING;
        END IF;

    END IF;
END $$;

-- 3. Update Policies for 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Clean up old 'profiles' table to avoid confusion (Optional - keeping for safety but renamed)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE public.profiles RENAME TO profiles_backup;
    END IF;
END $$;

-- 5. Fix Foreign Keys to reference 'users'
-- Addresses
DO $$
BEGIN
    -- Drop old FK if it references profiles
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='addresses_user_id_fkey') THEN
        ALTER TABLE addresses DROP CONSTRAINT addresses_user_id_fkey;
    END IF;
    -- Add new FK to users
    ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='orders_user_id_fkey') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
    END IF;
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Kitchens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='kitchens_owner_id_fkey') THEN
        ALTER TABLE kitchens DROP CONSTRAINT kitchens_owner_id_fkey;
    END IF;
    ALTER TABLE kitchens ADD CONSTRAINT kitchens_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);
END $$;
