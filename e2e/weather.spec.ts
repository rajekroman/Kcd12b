import { expect, test, type Page } from '@playwright/test';

const economy = {
  inventory: {
    groschen: 85,
    maxWeight: 25,
    items: [
      { itemId: 'bohdan-sword', quantity: 1 },
      { itemId: 'bread', quantity: 2 },
      { itemId: 'bandage', quantity: 1 }
    ],
    equipment: { weapon: 'bohdan-sword', armor: null, accessory: null }
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

const continueAt = async (page: Page, dayClock: number): Promise<void> => {
  await page.addInitScript(
    ({ clock, savedEconomy }) => {
      localStorage.setItem(
        'chronicles-of-bohemia.save.v4',
        JSON.stringify({
          version: 4,
          player: { x: 240, y: 390, health: 100, stamina: 100 },
          quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
          world: { dayClock: clock },
          economy: savedEconomy,
          reputation: { peasants: 0, townsfolk: 0, nobility: 0 },
          savedAt: '2026-07-18T08:00:00.000Z'
        })
      );
    },
    { clock: dayClock, savedEconomy: economy }
  );

  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await expect(body).toHaveAttribute('data-has-save', 'true');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.77);

  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
};

test('uložený úsvit obnoví jasno a suchý povrch', async ({ page }) => {
  await continueAt(page, 30);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-world-hour', '6.00');
  await expect(body).toHaveAttribute('data-weather', 'clear');
  await expect(body).toHaveAttribute('data-weather-label', 'Jasno');
  await expect(body).toHaveAttribute('data-light-phase', 'dawn');
  await expect(body).toHaveAttribute('data-weather-rain-density', '0');
  await expect(body).toHaveAttribute('data-weather-wetness', '0.00');
});

test('dopoledne přejde do zataženého světla bez deště', async ({ page }) => {
  await continueAt(page, 50);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-world-hour', '10.00');
  await expect(body).toHaveAttribute('data-weather', 'cloudy');
  await expect(body).toHaveAttribute('data-light-phase', 'day');
  await expect(body).toHaveAttribute('data-weather-rain-density', '0');
  await expect(body).toHaveAttribute('data-weather-visibility', '0.90');
});

test('odpolední déšť aktivuje srážky a mokrý povrch', async ({ page }) => {
  await continueAt(page, 70);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-world-hour', '14.00');
  await expect(body).toHaveAttribute('data-weather', 'rain');
  await expect(body).toHaveAttribute('data-weather-label', 'Déšť');
  await expect(body).toHaveAttribute('data-weather-rain-density', '58');
  await expect(body).toHaveAttribute('data-weather-wetness', '0.72');
  await expect(body).toHaveAttribute('data-weather-visibility', '0.78');
});

test('bouře za soumraku používá maximální déšť a bleskový stav', async ({ page }) => {
  await continueAt(page, 90);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-world-hour', '18.00');
  await expect(body).toHaveAttribute('data-weather', 'storm');
  await expect(body).toHaveAttribute('data-weather-label', 'Bouře');
  await expect(body).toHaveAttribute('data-light-phase', 'dusk');
  await expect(body).toHaveAttribute('data-weather-rain-density', '92');
  await expect(body).toHaveAttribute('data-weather-wetness', '1.00');
  await expect(body).toHaveAttribute('data-lightning', /true|false/);
});
