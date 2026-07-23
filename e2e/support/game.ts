import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

const APP_PATH = '/Kcd12b/';

export async function waitForAnimationFrames(page: Page, frameCount = 8): Promise<void> {
  await page.evaluate(async (frames) => {
    await new Promise<void>((resolve) => {
      let remaining = frames;
      const tick = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, frameCount);
}

export async function waitForMenuReady(page: Page): Promise<void> {
  await page.goto(APP_PATH);
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'menu');
  await expect(page.locator('body')).toHaveAttribute('data-menu-ready', 'true');
  await expect(page.locator('#game-status')).toContainText('Hlavní menu');
}

export async function startNewGame(page: Page): Promise<void> {
  await waitForMenuReady(page);
  const canvas = page.locator('#app canvas');
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Phaser canvas nemá dostupné rozměry.');

  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.64);
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('body')).toHaveAttribute('data-save-ready', 'true');
  await expect(page.locator('#game-status')).not.toContainText('Načítání hry');
}

export async function movePlayer(page: Page, projectName: string): Promise<void> {
  const canvas = page.locator('#app canvas');
  const before = await canvas.screenshot();

  if (projectName.startsWith('iphone-')) {
    const right = page.locator('[data-control="right"]');
    await expect(right).toBeVisible();
    await right.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 1
    });
    await waitForAnimationFrames(page, 12);
    await right.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 0
    });
  } else {
    await page.keyboard.down('ArrowRight');
    await waitForAnimationFrames(page, 12);
    await page.keyboard.up('ArrowRight');
  }

  await expect.poll(async () => Buffer.compare(before, await canvas.screenshot())).not.toBe(0);
}

export async function openInventory(page: Page, projectName: string): Promise<Locator> {
  if (projectName.startsWith('iphone-')) {
    await page.locator('[data-control="inventory"]').dispatchEvent('pointerdown', {
      pointerId: 2,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 1
    });
  } else {
    await page.keyboard.press('i');
  }

  const modal = page.locator('#economy-overlay');
  await expect(modal).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'true');
  return modal;
}

export async function closeInventory(page: Page): Promise<void> {
  await page.locator('[data-economy-close]').click();
  await expect(page.locator('#economy-overlay')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'false');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'game');
}

export async function attachEvidence(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
}
