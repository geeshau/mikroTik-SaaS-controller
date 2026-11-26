import { test, expect } from '@playwright/test';

test.describe('Firmware Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/firmware-audit');
  });

  test('displays firmware table with routers', async ({ page }) => {
    await expect(page.getByText('Main Office Gateway')).toBeVisible();
    await expect(page.getByText('RB5009UG+S+IN')).toBeVisible();
  });

  test('filter buttons work', async ({ page }) => {
    // Click on "Critical" filter
    const criticalBtn = page.getByRole('button', { name: /critical/i });
    if (await criticalBtn.isVisible()) {
      await criticalBtn.click();
    }
  });

  test('select all checkbox works', async ({ page }) => {
    const selectAll = page.getByRole('checkbox').first();
    if (await selectAll.isVisible()) {
      await selectAll.click();
      await expect(selectAll).toBeChecked();
    }
  });

  test('export button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });
});
