# Fix: Kitchens Not Showing on Home Page

## Problem
The app is running successfully, but kitchens are not appearing on the home page. This is caused by Row Level Security (RLS) policies in Supabase that prevent anonymous users from accessing the `kitchens` table.

## Solution

### Option 1: Apply RLS Fix (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com and log into your account
   - Select your `maakhana-app` project

2. **Navigate to SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Fix**
   - Copy the entire content of **`fix_kitchens_rls.sql`** file (this is the simplified version)
   - Paste it into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

4. **Verify the Fix**
   - The query should complete successfully
   - You should see "Success. No rows returned" or similar message

### Option 2: Test the Fix

After applying the RLS fix, test that kitchens are now accessible:

```bash
# Run the test script
node test_kitchens.js
```

Expected output:
```
Testing kitchen access...
✅ Success! Found 3 kitchens

Sample kitchen data:
{
  "id": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "kitchen_name": "Anita's Kitchen",
  "maa_name": "Anita Ma",
  "rating": 4.8,
  "is_active": true,
  ...
}
```

### Option 3: Manual SQL Commands

If you prefer, run these individual commands in the SQL Editor:

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Grant public access
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Create public read policy
DROP POLICY IF EXISTS "Public Read Kitchens" ON kitchens;
CREATE POLICY "Public Read Kitchens" ON kitchens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);
```

## Expected Results

After applying the fix:

1. **Restart the Expo Server** (optional, but recommended)
   - Press `Ctrl + C` in the terminal
   - Run `npm start` again

2. **Check the App**
   - The home page should now show 3 kitchens:
     - Anita's Kitchen
     - Sunita's Delights
     - Meera's Rasoi

3. **Check Console Logs**
   - The app should show:
     ```
     Fetched kitchens count: 3
     Sample kitchen: { ... }
     ```

## Troubleshooting

### Still Not Working?

1. **Check Supabase Connection**
   - Verify `.env` file has correct Supabase URL and Anon Key
   - Run: `echo $EXPO_PUBLIC_SUPABASE_URL`

2. **Verify RLS is Disabled**
   - In Supabase, go to **Authentication** > **Policies**
   - Ensure policies for `kitchens` table are working

3. **Check Database Data**
   - Run in SQL Editor:
     ```sql
     SELECT id, kitchen_name, is_active FROM kitchens WHERE is_active = true;
     ```
   - Should return 3 rows

4. **Clear Expo Cache**
   - Press `s` in terminal to switch to development build
   - Or clear cache: `npm start -- --clear`

### Error Messages

If you see these errors in the console:

- **"relation 'kitchens' does not exist"** → Run `db_schema.sql` first
- **"permission denied for table kitchens"** → RLS fix needed (follow Option 1)
- **"401 Unauthorized"** → Check Supabase anon key

## Files Created

- `fix_schema_rls.sql` - SQL script to fix RLS policies
- `test_kitchens.js` - Test script to verify kitchen access
- `FIX_KITCHENS.md` - This instruction file

## After Fix

Once kitchens appear on the home page, you can:

1. Click on any kitchen card to view menu items
2. Add items to cart
3. Proceed to checkout
4. View order status

## Need Help?

If you're still having issues:
1. Check the Supabase logs in the dashboard
2. Verify the database has been seeded (check `seed_data.sql`)
3. Make sure you're using the correct Supabase project

The app is now running on http://localhost:8081 (web) or via Expo Go (mobile).
