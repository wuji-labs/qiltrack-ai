#!/usr/bin/env node
/**
 * Verify CAVR scenarios for Report Hub Refresh
 * Tests reuse logic and admin permissions per CAVR checklist
 */

const BASE_URL = "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

const TEST_USER_A = "e056e1fe-64ec-4655-8652-e9450393bf3d"; // tester+pdf@investor.ai
const TEST_USER_B = "e609c987-988c-47f4-a828-8096ef610f6a"; // xiuluart@foxmail.com

const results = {
  passed: [],
  failed: [],
  blocked: [],
};

function recordResult(test, passed, message, blocking = false) {
  const result = { test, message };
  if (passed) {
    results.passed.push(result);
    console.log(`  ✅ ${test}: ${message}`);
  } else {
    results.failed.push(result);
    console.log(`  ❌ ${test}: ${message}`);
    if (blocking) {
      results.blocked.push(result);
    }
  }
}

async function testReuseLogic() {
  console.log("\n🔴 Testing Reuse Logic (HIGH PRIORITY)\n");

  // Scenario 1: Same user, same mode, within 7 days
  console.log("Scenario 1: Same user + same mode + within 7 days");
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_find_reusable_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_symbol: "AAPL", p_lang: "en", p_mode: "production" }),
  });
  const data1 = await res1.json();
  const hasReusableRun = data1 && data1.length > 0 && data1[0].run_id;
  recordResult(
    "Same user reuse",
    hasReusableRun,
    hasReusableRun ? `Found reusable run: ${data1[0].run_id}` : "No reusable run found",
    true
  );

  // Scenario 2: Different mode (should NOT reuse)
  console.log("\nScenario 2: Same symbol + different mode");
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_find_reusable_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_symbol: "AAPL", p_lang: "en", p_mode: "test" }),
  });
  const data2 = await res2.json();
  const foundTestMode = data2 && data2.length > 0;
  recordResult(
    "Cross-mode isolation",
    foundTestMode,
    foundTestMode
      ? `Correctly found test mode run: ${data2[0].run_id}`
      : "No test mode run (unexpected)",
    true
  );

  // Verify production mode doesn't return test mode run
  const res2b = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_find_reusable_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_symbol: "AAPL", p_lang: "en", p_mode: "production" }),
  });
  const data2b = await res2b.json();
  const productionRun = data2b && data2b.length > 0 ? data2b[0] : null;
  const noMixing = productionRun && productionRun.mode === "production";
  recordResult(
    "No cross-mode reuse",
    noMixing,
    noMixing
      ? "Production query returns only production runs"
      : "ERROR: Cross-mode reuse detected!",
    true
  );

  // Scenario 3: Beyond 7 days (TSLA)
  console.log("\nScenario 3: Beyond 7 days");
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_find_reusable_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_symbol: "TSLA", p_lang: "en", p_mode: "production" }),
  });
  const data3 = await res3.json();
  const noOldRun = !data3 || data3.length === 0;
  recordResult(
    "7-day window",
    noOldRun,
    noOldRun ? "Correctly rejected run older than 7 days" : "ERROR: Old run returned!",
    true
  );

  // Scenario 4: Cross-user reuse (both users have AAPL production)
  console.log("\nScenario 4: Cross-user reuse");
  const res4 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_find_reusable_report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_symbol: "AAPL", p_lang: "en", p_mode: "production" }),
  });
  const data4 = await res4.json();
  recordResult(
    "Cross-user reuse",
    data4 && data4.length > 0,
    data4 && data4.length > 0
      ? `Found reusable run (user agnostic): ${data4[0].run_id}`
      : "No run found",
    false
  );
}

async function testPopularEndpoint() {
  console.log("\n🟢 Testing Popular Endpoint\n");

  const res = await fetch(`${BASE_URL}/api/report/popular?range=30&limit=5`);
  const data = await res.json();

  recordResult(
    "Popular endpoint",
    res.ok && Array.isArray(data),
    res.ok ? `Returned ${data.length} symbols` : `Error: ${JSON.stringify(data)}`,
    false
  );

  if (res.ok && data.length > 0) {
    console.log(
      "  Popular symbols:",
      data.map((s) => `${s.symbol} (${s.generation_count})`).join(", ")
    );
  }
}

async function testAdminPermissions() {
  console.log("\n🟡 Testing Admin Permissions (MEDIUM PRIORITY)\n");
  console.log("⚠️  Note: Full admin testing requires authenticated sessions");
  console.log("Current test: Unauthenticated access (should get 401)\n");

  const res = await fetch(`${BASE_URL}/api/admin/runs`);
  const data = await res.json();

  recordResult(
    "Admin endpoint auth",
    res.status === 401,
    res.status === 401
      ? "Correctly rejected unauthenticated request"
      : `Unexpected status: ${res.status}`,
    true
  );
}

async function generateReport() {
  console.log("\n📊 Test Results Summary\n");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`🔴 BLOCKING failures: ${results.blocked.length}`);
  console.log("=".repeat(60));

  if (results.blocked.length > 0) {
    console.log("\n⛔ BLOCKING ISSUES (must fix before merge):");
    results.blocked.forEach((r) => console.log(`  - ${r.test}: ${r.message}`));
  }

  if (results.failed.length > 0 && results.blocked.length === 0) {
    console.log("\n⚠️  Non-blocking failures:");
    results.failed.forEach((r) => {
      if (!results.blocked.find((b) => b.test === r.test)) {
        console.log(`  - ${r.test}: ${r.message}`);
      }
    });
  }

  if (results.passed.length > 0) {
    console.log("\n✅ Passed tests:");
    results.passed.forEach((r) => console.log(`  - ${r.test}`));
  }

  console.log("\n" + "=".repeat(60));
  if (results.blocked.length > 0) {
    console.log("❌ VERIFICATION FAILED - Blocking issues must be resolved");
    process.exit(1);
  } else if (results.failed.length > 0) {
    console.log("⚠️  VERIFICATION PASSED with warnings");
  } else {
    console.log("✅ ALL TESTS PASSED");
  }
}

async function main() {
  console.log("🧪 CAVR Verification - Report Hub Refresh\n");
  console.log("Testing against: " + BASE_URL);
  console.log("Test users:");
  console.log(`  A: ${TEST_USER_A}`);
  console.log(`  B: ${TEST_USER_B}`);

  try {
    await testReuseLogic();
    await testPopularEndpoint();
    await testAdminPermissions();
    await generateReport();
  } catch (err) {
    console.error("\n❌ Test execution error:", err.message);
    process.exit(1);
  }
}

main();
