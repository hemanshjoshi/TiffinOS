
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqrujwwogtvrlcxrqzlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnVqd3dvZ3R2cmxjeHJxemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzg2MDgsImV4cCI6MjA3ODg1NDYwOH0.hcPectl0SmKHwvF5xiwjbXrBcjjpv2QJWOqCAXu7pxQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Listing tables in public schema...");
  
  // We can't query information_schema directly via JS client usually unless configured, 
  // but we can try RPC if available, or just guess.
  // Actually, standard postgrest doesn't expose information_schema.
  // But we can check if 'partners' or 'restaurants' table exists by trying to select from them.
  
  const potentialTables = ['kitchens', 'profiles', 'users', 'orders', 'order_items', 'menu_items', 'coupons'];
  
  for (const table of potentialTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table '${table}' exists.`);
    } else {
      console.log(`Table '${table}' error:`, error.message);
    }
  }
}

listTables();
