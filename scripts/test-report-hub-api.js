#!/usr/bin/env node
/**
 * Test script for Report Hub Refresh API endpoints
 * Tests migration status and core functionality
 */

const BASE_URL = "http://localhost:3000";

async function testMigrationStatus() {
  console.log("\n🔍 Testing Migration Status...\n");

  // Test 1: availability endpoint exists (should return 401 without auth)
  try {
    const res = await fetch(`${BASE_URL}/api/report/availability?symbol=AAPL&mode=production`);
    console.log(`✓ availability endpoint: ${res.status} ${res.statusText}`);
    if (res.status === 401) {
      console.log("  → Expected 401 (needs auth), endpoint exists");
    }
  } catch (err) {
    console.log(`✗ availability endpoint failed: ${err.message}`);
  }

  // Test 2: popular endpoint (should work without auth if implemented)
  try {
    const res = await fetch(`${BASE_URL}/api/report/popular?range=30&limit=5`);
    const data = await res.json();
    console.log(`✓ popular endpoint: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log(`  → Returned ${data.length || 0} popular symbols`);
    } else {
      console.log(`  → Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`✗ popular endpoint failed: ${err.message}`);
  }

  // Test 3: admin/runs endpoint (should return 401/403 without admin auth)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/runs`);
    const data = await res.json();
    console.log(`✓ admin/runs endpoint: ${res.status} ${res.statusText}`);
    console.log(`  → ${JSON.stringify(data)}`);
  } catch (err) {
    console.log(`✗ admin/runs endpoint failed: ${err.message}`);
  }

  console.log("\n📋 Migration Check Summary:");
  console.log("- If all endpoints return proper status codes, migration may be applied");
  console.log("- Unauthorized errors (401) confirm auth checks work");
  console.log("- To verify schema changes, need Supabase Dashboard access");
}

async function main() {
  console.log("🧪 Report Hub Refresh - API Test\n");
  console.log(`Target: ${BASE_URL}`);
  await testMigrationStatus();
  console.log("\n✅ Test completed");
}

main().catch(console.error);
