import { expect, test } from '@playwright/test';

test('hra zobrazí canvas a dotykové ovládání', async ({ page }) => {
  await page.goto('/Kcd12b/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#mobile-controls')).toBeAttached();
});
