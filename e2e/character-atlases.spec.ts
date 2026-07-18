import { expect, test, type Page } from '@playwright/test';

const startNewGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-scene', 'menu');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.64);

  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-player-atlas', 'player');
  await expect(body).toHaveAttribute('data-bandit-atlas', 'bandit');
};

test('boot registruje dvanáct atlasů a deset unikátních profesních NPC', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-character-atlases', '12');
  const rawKeys = await body.getAttribute('data-npc-atlas-keys');
  if (!rawKeys) throw new Error('NPC atlas key snapshot is unavailable.');
  const keys = JSON.parse(rawKeys) as string[];

  expect(keys).toHaveLength(10);
  expect(new Set(keys).size).toBe(10);
  expect(keys).toContain('smith-bohdan');
  expect(keys).toContain('guard-vojtech');
  expect(keys).toContain('trader-katerina');
  expect(keys).not.toContain('smith');
});

test('hráč přechází mezi klidem chůzí a útokovou animací', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-player-animation', 'player:idle');

  await page.keyboard.down('d');
  await expect(body).toHaveAttribute('data-player-animation', 'player:walk');
  await page.keyboard.up('d');
  await expect(body).toHaveAttribute('data-player-animation', 'player:idle');

  await page.keyboard.press('Space');
  await expect(body).toHaveAttribute('data-player-animation', 'player:action');
  await expect(body).toHaveAttribute('data-stamina', '85');
  await expect(body).toHaveAttribute('data-player-animation', 'player:idle', { timeout: 1200 });
});
