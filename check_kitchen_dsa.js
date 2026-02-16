
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqrujwwogtvrlcxrqzlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnVqd3dvZ3R2cmxjeHJxemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzg2MDgsImV4cCI6MjA3ODg1NDYwOH0.hcPectl0SmKHwvF5xiwjbXrBcjjpv2QJWOqCAXu7pxQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllKitchens() {
  console.log("Listing all kitchens...");
  
  const { data, error } = await supabase
    .from('kitchens')
    .select('id, kitchen_name, is_active, owner_id')
    .limit(20);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Kitchens found:", data);
  }
}

listAllKitchens();
