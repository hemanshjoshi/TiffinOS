// Test script to check if kitchens are accessible
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKitchens() {
  console.log('Testing kitchen access...');
  
  const { data: kitchens, error } = await supabase
    .from('kitchens')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching kitchens:', error.message);
    console.error('This is likely an RLS policy issue.');
    console.error('\nPlease run the fix_schema_rls.sql in Supabase SQL Editor.');
    return false;
  }

  console.log('✅ Success! Found', kitchens?.length || 0, 'kitchens');
  
  if (kitchens && kitchens.length > 0) {
    console.log('\nSample kitchen data:');
    console.log(JSON.stringify(kitchens[0], null, 2));
  }
  
  return true;
}

testKitchens();
