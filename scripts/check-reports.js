const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReports() {
  console.log('Checking report_posts table...');

  const { data, error } = await supabase
    .from('report_posts')
    .select('id, symbol, created_at, status, slug, user_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data?.length || 0} reports:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkReports();
