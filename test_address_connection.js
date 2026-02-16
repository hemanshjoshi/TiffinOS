
const { createClient } = require('@supabase/supabase-js');

// Credentials from .env
const supabaseUrl = 'https://nqrujwwogtvrlcxrqzlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnVqd3dvZ3R2cmxjeHJxemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzg2MDgsImV4cCI6MjA3ODg1NDYwOH0.hcPectl0SmKHwvF5xiwjbXrBcjjpv2QJWOqCAXu7pxQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("1. Testing connection to 'kitchens' table (Public Read)...");
  const { data: kitchens, error: kitchenError } = await supabase.from('kitchens').select('*').limit(1);
  
  if (kitchenError) {
    console.error("❌ Connection Failed:", kitchenError.message);
    return;
  }
  console.log("✅ Connection Successful! Found", kitchens.length, "kitchens.");

  console.log("\n2. Testing Insert into 'addresses' table (RLS Check)...");
  console.log("Note: This is expected to fail if you are not logged in, but the ERROR MESSAGE is what we need.");
  
  const testAddress = {
    house_flat_no: 'Test House',
    street_area: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    user_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
  };

  const { data: address, error: addressError } = await supabase.from('addresses').insert([testAddress]).select();

  if (addressError) {
    console.log("❌ Insert Failed (As Expected/Unexpected):");
    console.log("   Code:", addressError.code);
    console.log("   Message:", addressError.message);
    console.log("   Details:", addressError.details);
    console.log("   Hint:", addressError.hint);
    
    if (addressError.code === '42501') {
      console.log("\n-> DIAGNOSIS: Error 42501 means 'Row Level Security Policy Violation'.");
      console.log("   This confirms the table exists but your user permission is blocking the save.");
      console.log("   Running the SQL fix I provided is the correct solution.");
    } else if (addressError.code === '42P01') {
      console.log("\n-> DIAGNOSIS: Error 42P01 means 'Undefined Table'.");
      console.log("   This would mean the 'addresses' table does not exist.");
    }
  } else {
    console.log("✅ Insert Successful (Surprisingly)!");
  }
}

testConnection();
