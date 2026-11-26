import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use(devices['iPhone 13']);

  test('mobile navigation drawer opens', async ({ page }) => {
    await page.goto('/');
    
    const hamburger = page.getByRole('button', { name: /open navigation/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    
    // Navigation should be visible
    await expect(page.getByText('WAN Overview')).toBeVisible();
  });

  test('mobile: no horizontal overflow', async ({ page }) => {
    const paths = ['/', '/network', '/firmware-audit', '/audit-log'];
    for (const path of paths) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `${path} has overflow on mobile`).toBe(false);
    }
  });
});
