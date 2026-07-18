import { expect, test, type Page } from '@playwright/test';

const legacyEconomy = {
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

const installLegacyHuntingSave = async (page: Page): Promise<void> => {
  await page.addInitScript((economy) => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v4',
      JSON.stringify({
        version: 4,
        player: { x: 265, y: 165, health: 100, stamina: 100 },
        quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
        world: { dayClock: 30 },
        economy,
        reputation: { peasants: 0, townsfolk: 0, nobility: 0 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  }, legacyEconomy);
};

const clickContinue = async (page: Page): Promise<void> => {
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

const readPrimarySave = async (page: Page): Promise<Record<string, unknown> | null> =>
  page.evaluate(async () => {
    const request = indexedDB.open('chronicles-of-bohemia', 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('saves', 'readonly');
    const recordRequest = transaction.objectStore('saves').get('primary');
    const record = await new Promise<{ payload?: Record<string, unknown> } | undefined>(
      (resolve, reject) => {
        recordRequest.onsuccess = () => resolve(recordRequest.result);
        recordRequest.onerror = () => reject(recordRequest.error);
      }
    );
    database.close();
    return record?.payload ?? null;
  });

test('zajíc uteče při přiblížení a lov respektuje počasí i denní aktivitu', async ({ page }) => {
  await installLegacyHuntingSave(page);
  await page.goto('/Kcd12b/');
  await clickContinue(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-fauna-atlases', '3');
  await expect(body).toHaveAttribute('data-fauna-count', '3');
  await expect(body).toHaveAttribute('data-fauna-species', '["hare","roe-deer","boar"]');
  await expect(body).toHaveAttribute('data-world-hour', '6.00');
  await expect(body).toHaveAttribute('data-weather-visibility', '1.00');

  const before = JSON.parse((await body.getAttribute('data-fauna-snapshot')) ?? '[]') as Array<{
    id: string;
    active: boolean;
    y: number;
  }>;
  const hareBefore = before.find((animal) => animal.id === 'hare-north');
  expect(hareBefore?.active).toBe(true);
  await page.waitForTimeout(180);
  const after = JSON.parse((await body.getAttribute('data-fauna-snapshot')) ?? '[]') as Array<{
    id: string;
    y: number;
  }>;
  const hareAfter = after.find((animal) => animal.id === 'hare-north');
  expect(hareAfter?.y).toBeLessThan(hareBefore?.y ?? Number.POSITIVE_INFINITY);
});

test('potvrzený útok přidá kořist a uloží ulovenou zvěř do verze 5', async ({ page }) => {
  await installLegacyHuntingSave(page);
  await page.goto('/Kcd12b/');
  await clickContinue(page);
  const body = page.locator('body');

  await page.keyboard.press('Space');
  await expect(body).toHaveAttribute('data-hunted-animals', '["hare-north"]');
  await expect(body).toHaveAttribute('data-last-message', /Zajíc uloven/);
  await expect(body).toHaveAttribute('data-last-save', 'ok');

  await page.keyboard.press('i');
  await expect(body).toHaveAttribute('data-economy-open', 'true');
  await expect(page.locator('[data-item="hare-meat"]')).toContainText('Zaječí maso');
  await expect(page.locator('[data-item="hare-meat"]')).toContainText('×1');
  await page.keyboard.press('Escape');

  const save = await readPrimarySave(page);
  expect(save?.version).toBe(5);
  expect(save?.world).toEqual({ dayClock: expect.any(Number), huntedAnimals: ['hare-north'] });

  await page.reload();
  await clickContinue(page);
  await expect(body).toHaveAttribute('data-hunted-animals', '["hare-north"]');
  const snapshot = JSON.parse((await body.getAttribute('data-fauna-snapshot')) ?? '[]') as Array<{
    id: string;
    dead: boolean;
    active: boolean;
  }>;
  expect(snapshot.find((animal) => animal.id === 'hare-north')).toMatchObject({
    dead: true,
    active: false
  });

  await page.keyboard.press('i');
  await expect(page.locator('[data-item="hare-meat"]')).toContainText('×1');
});
