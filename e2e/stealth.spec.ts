import { expect, test, type Page } from '@playwright/test';

const initialEconomy = {
  inventory: {
    groschen: 85,
    maxWeight: 25,
    items: [
      { itemId: 'bohdan-sword', quantity: 1 },
      { itemId: 'bread', quantity: 2 },
      { itemId: 'bandage', quantity: 1 }
    ],
    equipment: {
      weapon: 'bohdan-sword',
      armor: null,
      accessory: null
    }
  },
  merchant: {
    id: 'trader-katerina',
    groschen: 500,
    stock: [
      { itemId: 'wood-axe', quantity: 1 },
      { itemId: 'bread', quantity: 8 }
    ]
  }
};

const installStealthSave = async (
  page: Page,
  player: { x: number; y: number }
): Promise<void> => {
  await page.addInitScript(
    ({ position, economy }) => {
      localStorage.setItem(
        'chronicles-of-bohemia.save.v4',
        JSON.stringify({
          version: 4,
          player: { ...position, health: 100, stamina: 100 },
          quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
          world: { dayClock: 35 },
          economy,
          reputation: { peasants: 0, townsfolk: 0, nobility: 0 },
          savedAt: '2026-07-18T08:00:00.000Z'
        })
      );
    },
    { position: player, economy: initialEconomy }
  );
};

const continueGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-scene', 'menu');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await expect(body).toHaveAttribute('data-has-save', 'true');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.77);

  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-npc-count', '10');
};

test('hráč za strážným zůstane mimo zorný kužel a v klidu', async ({ page }) => {
  await installStealthSave(page, { x: 820, y: 375 });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-player-visible', 'false');
  await expect(body).toHaveAttribute('data-stealth-level', 'unaware');
  await expect(body).toHaveAttribute('data-suspicion', '0');
});

test('pobyt v kuželu vyvolá podezření a poplach', async ({ page }) => {
  await installStealthSave(page, { x: 650, y: 375 });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-player-visible', 'true', { timeout: 3000 });
  await expect(body).toHaveAttribute('data-stealth-level', 'suspicious', { timeout: 3000 });
  await expect(body).toHaveAttribute('data-stealth-level', 'alerted', { timeout: 5000 });
  await expect(body).toHaveAttribute('data-suspicion', '100');
  await expect(body).toHaveAttribute('data-last-message', 'Poplach! Strážný tě odhalil.');
});

test('únik z kuželu zastaví odhalování a podezření vyprchá', async ({ page }) => {
  await installStealthSave(page, { x: 650, y: 375 });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-stealth-level', 'suspicious', { timeout: 3000 });

  await page.keyboard.down('s');
  await page.keyboard.down('a');
  await page.waitForTimeout(1500);
  await page.keyboard.up('a');
  await page.keyboard.up('s');

  await expect(body).toHaveAttribute('data-player-visible', 'false', { timeout: 3000 });
  await expect(body).toHaveAttribute('data-stealth-level', 'unaware', { timeout: 8000 });
  await expect(body).toHaveAttribute('data-suspicion', '0');
  await expect(body).toHaveAttribute('data-last-message', 'Strážný ztratil stopu.');
});
