const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReportUserId() {
  const targetUserId = '8fb6f7cc-6b8c-423f-9806-eb63b068fea0';

  console.log('Updating report_posts user_id to:', targetUserId);

  // Update all reports with null user_id to the current user
  const { data, error } = await supabase
    .from('report_posts')
    .update({ user_id: targetUserId })
    .is('user_id', null)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Successfully updated ${data?.length || 0} reports`);
    console.log(JSON.stringify(data, null, 2));
  }
}

fixReportUserId();
