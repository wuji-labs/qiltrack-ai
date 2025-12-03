const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
const { cookies } = require('next/headers');

async function testHistoryQuery() {
  try {
    // Simulate the API logic
    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const userId = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';
    const page = 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    console.log('Querying report_posts for user:', userId);

    const { data: reports, error: queryError, count } = await supabase
      .from('report_posts')
      .select(
        'id, symbol, created_at, status, slug, report_run_id, tone, lang',
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      console.error('Query error:', queryError);
      return;
    }

    console.log(`Found ${reports?.length || 0} reports (total: ${count})`);
    console.log(JSON.stringify(reports, null, 2));
  } catch (err) {
    console.error('Test error:', err);
  }
}

testHistoryQuery();
