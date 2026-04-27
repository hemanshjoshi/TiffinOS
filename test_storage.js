const { createClient } = require('@supabase/supabase-js');

const url = 'https://nqrujwwogtvrlcxrqzlt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnVqd3dvZ3R2cmxjeHJxemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzg2MDgsImV4cCI6MjA3ODg1NDYwOH0.hcPectl0SmKHwvF5xiwjbXrBcjjpv2QJWOqCAXu7pxQ';
const supabase = createClient(url, key);

async function check() {
  console.log('Listing buckets...');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', buckets.map(b => ({ name: b.name, public: b.public })));

  if (buckets.length > 0) {
    for (const b of buckets) {
      console.log(`Listing files in ${b.name}...`);
      const { data: files, error: fileError } = await supabase.storage.from(b.name).list();
      if (fileError) console.error(fileError);
      else console.log(files);
    }
  }
}

check();
