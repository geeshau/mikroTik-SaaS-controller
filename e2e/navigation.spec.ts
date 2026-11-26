import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', heading: 'Operations Dashboard' },
  { path: '/network', heading: 'Wide Area Network' },
  { path: '/sites', heading: 'Sites & Templates' },
  { path: '/sdwan', heading: 'SD-WAN Control' },
  { path: '/hotspots', heading: 'Hotspot Management' },
  { path: '/access-control', heading: 'IP Access Control' },
  { path: '/firmware-audit', heading: 'Firmware Auditor' },
  { path: '/bulk-push', heading: 'Bulk Push' },
  { path: '/audit-log', heading: 'Audit Log' },
  { path: '/client-portal', heading: 'Your Home Network' },
];

test.describe('Page Navigation', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders with heading "${heading}"`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });
  }

  test('no horizontal overflow on any page', async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `Page ${path} has horizontal overflow`).toBe(false);
    }
  });
});
