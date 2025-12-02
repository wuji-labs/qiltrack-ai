#!/usr/bin/env node
/**
 * Setup test data for Report Hub Refresh verification
 * Creates test report_runs with various scenarios:
 * - Same user, same mode, within 7 days (reusable)
 * - Different user, same mode, within 7 days (reusable but not own)
 * - Same symbol, different mode (should NOT be reusable)
 * - Beyond 7 days (should NOT be reusable)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Test user IDs (use real UUIDs from profiles table)
const TEST_USER_A = "00000000-0000-0000-0000-000000000001"; // Will need to replace
const TEST_USER_B = "00000000-0000-0000-0000-000000000002";

async function executeSql(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

async function getExistingUsers() {
  console.log("🔍 Fetching existing users from profiles...\n");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,plan&limit=5`, {
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch profiles: ${res.status}`);
  }

  const users = await res.json();
  console.log("Found users:");
  users.forEach((u) => console.log(`  - ${u.email} (${u.id}) [plan: ${u.plan}]`));
  console.log();

  return users;
}

async function createTestRuns(userA, userB) {
  console.log("📝 Creating test report_runs...\n");

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const testRuns = [
    {
      user_id: userA.id,
      symbol: "AAPL",
      lang: "en",
      mode: "production",
      status: "completed",
      created_at: threeDaysAgo.toISOString(),
      description: "User A, AAPL, production, 3 days ago (reusable)",
    },
    {
      user_id: userB.id,
      symbol: "AAPL",
      lang: "en",
      mode: "production",
      status: "completed",
      created_at: threeDaysAgo.toISOString(),
      description: "User B, AAPL, production, 3 days ago (reusable, not own)",
    },
    {
      user_id: userA.id,
      symbol: "AAPL",
      lang: "en",
      mode: "test",
      status: "completed",
      created_at: threeDaysAgo.toISOString(),
      description: "User A, AAPL, test mode, 3 days ago (different mode)",
    },
    {
      user_id: userA.id,
      symbol: "TSLA",
      lang: "en",
      mode: "production",
      status: "completed",
      created_at: tenDaysAgo.toISOString(),
      description: "User A, TSLA, production, 10 days ago (beyond 7 days)",
    },
    {
      user_id: userA.id,
      symbol: "GOOGL",
      lang: "en",
      mode: "production",
      status: "completed",
      created_at: threeDaysAgo.toISOString(),
      description: "User A, GOOGL, production, 3 days ago (reusable)",
    },
  ];

  for (const run of testRuns) {
    console.log(`Creating: ${run.description}`);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/report_runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: run.user_id,
        symbol: run.symbol,
        lang: run.lang,
        mode: run.mode,
        status: run.status,
        created_at: run.created_at,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.log(`  ❌ Failed: ${error}`);
    } else {
      const created = await res.json();
      console.log(`  ✅ Created run ID: ${created[0]?.id || "unknown"}`);
    }
  }
}

async function main() {
  console.log("🧪 Report Hub Refresh - Test Data Setup\n");

  try {
    const users = await getExistingUsers();

    if (users.length < 2) {
      console.log("⚠️  Need at least 2 users to test cross-user scenarios");
      console.log("Please create additional test users first.");
      return;
    }

    const [userA, userB] = users;
    await createTestRuns(userA, userB);

    console.log("\n✅ Test data setup complete");
    console.log("\nTest scenarios created:");
    console.log(
      "1. Same user + same mode + 3 days → should return reusable_run_id, is_own_report=true"
    );
    console.log(
      "2. Different user + same mode + 3 days → should return reusable_run_id, is_own_report=false"
    );
    console.log("3. Same symbol + different mode → should NOT be reusable (reusable_run_id=null)");
    console.log("4. Beyond 7 days → should NOT be reusable");
    console.log("\nNext: Test availability endpoint with these symbols");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
