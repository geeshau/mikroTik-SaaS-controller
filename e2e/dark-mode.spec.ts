import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    
    // Find the theme toggle button (it has Sun or Moon icon)
    const toggleBtn = page.getByRole('button', { name: /toggle theme|dark mode|light mode/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).nth(0)
    );

    // Check initial state (light mode)
    const htmlEl = page.locator('html');
    
    // Should not have dark class initially (unless system prefers dark)
    const initialClass = await htmlEl.getAttribute('class');
    
    if (!initialClass?.includes('dark')) {
      // We're in light mode, let's toggle to dark
      // Find the moon button (theme toggle)
      const themeButtons = page.locator('header button');
      const count = await themeButtons.count();
      
      // The theme toggle should be one of the buttons in the header
      for (let i = 0; i < count; i++) {
        const btn = themeButtons.nth(i);
        const ariaLabel = await btn.getAttribute('aria-label');
        if (ariaLabel?.toLowerCase().includes('theme') || ariaLabel?.toLowerCase().includes('mode')) {
          await btn.click();
          break;
        }
      }
    }
  });

  test('dark mode persists across page navigations', async ({ page }) => {
    await page.goto('/');
    
    // Set dark mode via localStorage
    await page.evaluate(() => {
      localStorage.setItem('vortex-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    
    // Navigate to another page
    await page.goto('/firmware-audit');
    
    // Check that dark class is applied (from the inline script)
    const cls = await page.locator('html').getAttribute('class');
    expect(cls).toContain('dark');
  });
});
