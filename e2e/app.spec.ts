import { test, expect } from '@playwright/test';

test.describe('Report Generation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should generate report for valid symbol', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/account');

    // Generate report
    await page.fill('input[placeholder*="symbol"]', 'AAPL');
    await page.selectOption('select[name="language"]', 'zh-Hans');
    await page.selectOption('select[name="tone"]', 'baseline');
    await page.click('button:has-text("Generate")');

    // Wait for generation
    await expect(page.locator('text=Generating')).toBeVisible();
    await expect(page.locator('text=Report generated')).toBeVisible({ timeout: 60000 });

    // Verify report content
    await expect(page.locator('h1')).toContainText('AAPL');
  });

  test('should handle insufficient credits', async ({ page }) => {
    // Login as user with 0 credits
    await page.goto('/account');

    await page.fill('input[placeholder*="symbol"]', 'AAPL');
    await page.click('button:has-text("Generate")');

    // Should show error
    await expect(page.locator('text=Insufficient credits')).toBeVisible();
  });
});

test.describe('Admin Panel E2E', () => {
  test('admin can view metrics', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Navigate to admin
    await page.goto('/admin');

    // Verify metrics visible
    await expect(page.locator('text=Total Reports')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Cache Hit Rate')).toBeVisible();
  });

  test('admin can view cache stats', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Cache Monitor');

    await expect(page.locator('text=Market Data Cache')).toBeVisible();
    await expect(page.locator('text=Report Cache')).toBeVisible();
  });

  test('admin can invalidate cache', async ({ page }) => {
    await page.goto('/admin/cache');
    await page.click('button:has-text("Invalidate")');
    await page.fill('input[placeholder="symbol"]', 'AAPL');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Cache invalidated')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('homepage loads within 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  test('cached report returns within 2s', async ({ page }) => {
    // Generate first (cache)
    await page.goto('/api/report?symbol=AAPL&lang=zh-Hans&tone=baseline');

    // Second request (cached)
    const start = Date.now();
    await page.goto('/api/report?symbol=AAPL&lang=zh-Hans&tone=baseline');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });
});
