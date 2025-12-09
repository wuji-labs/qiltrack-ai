#!/usr/bin/env node

/**
 * Test daily reward functionality
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

async function testDailyReward() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("🔍 Testing Daily Reward Functionality\n");
  console.log("=" .repeat(60));

  // 1. Check tables exist
  console.log("\n1️⃣  Checking database tables...");

  const { data: creditEvents, error: eventsError } = await supabase
    .from("report_credit_events")
    .select("id")
    .limit(1);

  if (eventsError) {
    console.error("   ❌ report_credit_events table:", eventsError.message);
  } else {
    console.log("   ✅ report_credit_events table exists");
  }

  const { data: dailyRewards, error: rewardsError } = await supabase
    .from("daily_rewards")
    .select("id")
    .limit(1);

  if (rewardsError) {
    console.error("   ❌ daily_rewards table:", rewardsError.message);
  } else {
    console.log("   ✅ daily_rewards table exists");
  }

  // 2. Check function exists
  console.log("\n2️⃣  Testing fn_claim_daily_reward function...");

  // Get a test user (xiuluart@foxmail.com)
  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, email, plan")
    .eq("email", "xiuluart@foxmail.com")
    .single();

  if (userError) {
    console.error("   ❌ User not found:", userError.message);
    return;
  }

  console.log(`   📧 Test user: ${users.email} (${users.plan})`);

  // Check current credits
  const { data: credits } = await supabase
    .from("report_credits")
    .select("credits_available")
    .eq("user_id", users.id)
    .single();

  console.log(`   💰 Current credits: ${credits?.credits_available || 0}`);

  // Check if already claimed today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayClaim } = await supabase
    .from("report_credit_events")
    .select("id, delta, created_at")
    .eq("user_id", users.id)
    .eq("event_type", "daily_reward")
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)
    .limit(1);

  if (todayClaim && todayClaim.length > 0) {
    console.log(`   ⏰ Already claimed today: +${todayClaim[0].delta} credits`);
    console.log(`   📅 Claim time: ${new Date(todayClaim[0].created_at).toLocaleString()}`);
  } else {
    console.log("   ⏰ Not claimed today yet");

    // Try to claim
    console.log("\n3️⃣  Testing daily reward claim...");
    const { data: claimResult, error: claimError } = await supabase.rpc(
      "fn_claim_daily_reward",
      { p_user_id: users.id }
    );

    if (claimError) {
      console.error("   ❌ Claim failed:", claimError.message);
    } else {
      console.log("   ✅ Claim result:", JSON.stringify(claimResult, null, 2));
    }
  }

  // 4. Check daily_rewards record
  console.log("\n4️⃣  Checking daily_rewards record...");
  const { data: rewardRecord } = await supabase
    .from("daily_rewards")
    .select("last_claimed_at, streak_count, total_claimed")
    .eq("user_id", users.id)
    .single();

  if (rewardRecord) {
    console.log("   ✅ Streak count:", rewardRecord.streak_count);
    console.log("   ✅ Total claimed:", rewardRecord.total_claimed);
    console.log("   ✅ Last claimed:", new Date(rewardRecord.last_claimed_at).toLocaleString());
  } else {
    console.log("   ⚠️  No daily_rewards record found");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Daily reward test complete!\n");
}

testDailyReward().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
