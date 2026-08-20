import { expect, test } from '@playwright/test';

const startVisualRebootRuntime = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-scene', 'menu');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');

  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.64);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-world-presentation', 'authored-pixel-art');
  await expect(body).toHaveAttribute('data-legacy-world-placeholders', 'false');
  await expect(body).toHaveAttribute('data-presentation-layers', '4');
  await expect(body).toHaveAttribute('data-player-presentation-proxy', 'decoupled');
  await expect(body).toHaveAttribute('data-character-projection', 'authoritative-affine');
  await expect(body).toHaveAttribute('data-presentation-npc-count', '10');
};

test('visual reboot runtime evidence', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === 'iphone-portrait',
    'Portrait medieval HUD/layout is owned by the later A5 visual gate.'
  );

  await startVisualRebootRuntime(page);
  await page.waitForTimeout(250);

  const screenshot = await page.screenshot({ fullPage: true });
  const evidenceName =
    testInfo.project.name === 'iphone-landscape'
      ? 'visual-reboot-iphone-landscape'
      : 'visual-reboot-desktop-daylight';

  await testInfo.attach(evidenceName, {
    body: screenshot,
    contentType: 'image/png'
  });
});
