import { expect, test, type Page } from '@playwright/test';

const startNewGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'menu');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');

  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.64);
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('body')).toHaveAttribute('data-ui-scene', 'active');
  await expect(page.locator('body')).toHaveAttribute('data-health', '100');
  await expect(page.locator('body')).toHaveAttribute('data-stamina', '100');
  await expect(page.locator('#game-status')).toContainText('Promluv s kovářem Bohdanem');
};

test('přechod menu → hra spustí UI scénu a aktuální HUD', async ({ page }, testInfo) => {
  await startNewGame(page);

  const controls = page.locator('#mobile-controls');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(controls).toBeVisible();
    await expect(page.locator('[data-control="block"]')).toBeVisible();
    await expect(page.locator('[data-control="dodge"]')).toBeVisible();
  } else {
    await expect(controls).toBeAttached();
  }
});

test('směr útoku, kryt a úhyb mění herní stav', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');

  await page.keyboard.press('Digit3');
  await expect(body).toHaveAttribute('data-attack-direction', 'right');

  await page.keyboard.press('Space');
  await expect(body).toHaveAttribute('data-stamina', '85');

  await page.keyboard.down('f');
  await expect(body).toHaveAttribute('data-blocking', 'true');
  await page.keyboard.up('f');
  await expect(body).toHaveAttribute('data-blocking', 'false');

  const staminaBeforeDodge = Number(await body.getAttribute('data-stamina'));
  await page.keyboard.press('Shift');
  await expect(body).toHaveAttribute('data-last-message', 'Úhyb.');
  await expect(body).toHaveAttribute('data-dodge-ready', 'false');
  const staminaAfterDodge = Number(await body.getAttribute('data-stamina'));

  expect(staminaAfterDodge).toBeLessThanOrEqual(staminaBeforeDodge - 20);
});
