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
      { itemId: 'padded-jack', quantity: 1 },
      { itemId: 'bread', quantity: 8 },
      { itemId: 'bandage', quantity: 5 }
    ]
  }
};

const installSave = async (
  page: Page,
  player: { x: number; y: number },
  dayClock: number
): Promise<void> => {
  await page.addInitScript(
    ({ position, clock, economy }) => {
      localStorage.setItem(
        'chronicles-of-bohemia.save.v4',
        JSON.stringify({
          version: 4,
          player: { ...position, health: 100, stamina: 100 },
          quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
          world: { dayClock: clock },
          economy,
          reputation: { peasants: 0, townsfolk: 0, nobility: 0 },
          savedAt: '2026-07-18T08:00:00.000Z'
        })
      );
    },
    { position: player, clock: dayClock, economy: initialEconomy }
  );
};

const clickMenuAction = async (page: Page, verticalRatio: number): Promise<void> => {
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * verticalRatio);
};

const startNewGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-scene', 'menu');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await clickMenuAction(page, 0.64);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
};

const continueGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await expect(body).toHaveAttribute('data-has-save', 'true');
  await clickMenuAction(page, 0.77);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
};

test('hudba se odemkne pouze uživatelským gestem a lze ji ztlumit', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');
  const button = page.locator('[data-audio-toggle]');

  await expect(body).toHaveAttribute('data-audio-status', 'locked');
  await expect(body).toHaveAttribute('data-audio-unlocked', 'false');
  await expect(body).toHaveAttribute('data-music-muted', 'true');
  await expect(body).toHaveAttribute('data-music-mood', 'silent');

  await button.click();
  await expect(body).toHaveAttribute('data-audio-status', 'ready');
  await expect(body).toHaveAttribute('data-audio-unlocked', 'true');
  await expect(body).toHaveAttribute('data-music-muted', 'false');
  await expect(body).toHaveAttribute('data-music-mood', 'dawn');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toContainText('Úsvit');

  await button.click();
  await expect(body).toHaveAttribute('data-music-muted', 'true');
  await expect(body).toHaveAttribute('data-music-mood', 'silent');
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  await page.keyboard.press('m');
  await expect(body).toHaveAttribute('data-music-muted', 'false');
  await expect(body).toHaveAttribute('data-music-mood', 'dawn');
});

test('uložené poledne vybere denní motiv', async ({ page }) => {
  await installSave(page, { x: 820, y: 375 }, 60);
  await continueGame(page);
  const body = page.locator('body');
  const button = page.locator('[data-audio-toggle]');

  await button.click();
  await expect(body).toHaveAttribute('data-music-mood', 'day');
  await expect(button).toContainText('Denní cesta');
});

test('uložená noc vybere noční motiv', async ({ page }) => {
  await installSave(page, { x: 820, y: 375 }, 10);
  await continueGame(page);
  const body = page.locator('body');
  const button = page.locator('[data-audio-toggle]');

  await button.click();
  await expect(body).toHaveAttribute('data-music-mood', 'night');
  await expect(button).toContainText('Noční hlídka');
});

test('podezření a poplach přepnou adaptivní hudební vrstvy', async ({ page }) => {
  await installSave(page, { x: 650, y: 375 }, 35);
  await continueGame(page);
  const body = page.locator('body');
  const button = page.locator('[data-audio-toggle]');

  await expect(body).toHaveAttribute('data-player-visible', 'true', { timeout: 3000 });
  await button.click();

  await expect(body).toHaveAttribute('data-stealth-level', 'suspicious', { timeout: 3000 });
  await expect(body).toHaveAttribute('data-music-mood', 'suspicious', { timeout: 3000 });
  await expect(button).toContainText('Podezření');

  await expect(body).toHaveAttribute('data-stealth-level', 'alerted', { timeout: 5000 });
  await expect(body).toHaveAttribute('data-music-mood', 'alerted', { timeout: 3000 });
  await expect(button).toContainText('Poplach');
});
