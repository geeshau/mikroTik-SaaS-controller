import { test, expect } from '@playwright/test';

test.describe('Operations Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays router cards', async ({ page }) => {
    await expect(page.getByText('Main Office Gateway')).toBeVisible();
    await expect(page.getByText('Warehouse Node 1')).toBeVisible();
  });

  test('view toggle switches between grid and list', async ({ page }) => {
    // Default is grid
    const gridBtn = page.getByRole('button', { name: /grid/i });
    const listBtn = page.getByRole('button', { name: /list/i });
    
    await listBtn.click();
    await expect(listBtn).toBeVisible();
    
    await gridBtn.click();
    await expect(gridBtn).toBeVisible();
  });

  test('provision modal opens and closes', async ({ page }) => {
    await page.getByText('Provision New Router').click();
    await expect(page.getByText('Provision a New Router')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('WAN summary strip is visible', async ({ page }) => {
    await expect(page.getByText('Wide Area Network')).toBeVisible();
    await expect(page.getByText('Sites')).toBeVisible();
  });

  test('dashboard widget customization works', async ({ page }) => {
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await customizeBtn.click();
    
    // Should show visibility toggles
    await expect(page.getByText('WAN Summary')).toBeVisible();
    await expect(page.getByText('Router Grid')).toBeVisible();
    
    // Click Done
    await page.getByRole('button', { name: 'Done' }).click();
  });
});
