import { expect, test, type Page } from '@playwright/test';

interface StoredBrowserSave {
  version: number;
  player: { health: number; stamina: number };
  world: { dayClock: number };
}

interface NpcScheduleSnapshot {
  id: string;
  activity: string;
  locationId: string;
}

const readNpcSchedules = async (page: Page): Promise<NpcScheduleSnapshot[]> => {
  const raw = await page.locator('body').getAttribute('data-npc-schedules');
  if (!raw) throw new Error('NPC schedule snapshot is unavailable.');
  return JSON.parse(raw) as NpcScheduleSnapshot[];
};

const startNewGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  await expect(page.locator('canvas')).toBeVisible();
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-scene', 'menu');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');

  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.64);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-ui-scene', 'active');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-health', '100');
  await expect(body).toHaveAttribute('data-stamina', '100');
  await expect(body).toHaveAttribute('data-npc-count', '10');
  await expect(page.locator('#game-status')).toContainText('Promluv s kovářem Bohdanem');
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

test('přechod menu → hra spustí UI scénu, HUD a deset ranních obyvatel', async ({
  page
}, testInfo) => {
  await startNewGame(page);

  const controls = page.locator('#mobile-controls');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(controls).toBeVisible();
    await expect(page.locator('[data-control="block"]')).toBeVisible();
    await expect(page.locator('[data-control="dodge"]')).toBeVisible();
  } else {
    await expect(controls).toBeAttached();
  }

  const schedules = await readNpcSchedules(page);
  expect(schedules).toHaveLength(10);
  expect(schedules).toContainEqual({
    id: 'smith-bohdan',
    activity: 'working',
    locationId: 'forge'
  });
  expect(schedules).toContainEqual({
    id: 'innkeeper-marta',
    activity: 'serving',
    locationId: 'tavern'
  });
  expect(schedules).toContainEqual({
    id: 'farmer-ondra',
    activity: 'working',
    locationId: 'north-field'
  });
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

test('datové podmínky vyberou správný Bohdanův dialog v pracovní době', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v2',
      JSON.stringify({
        version: 2,
        player: { x: 370, y: 340, health: 92, stamina: 81 },
        quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
        world: { dayClock: 45 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  });

  await continueGame(page);
  const schedules = await readNpcSchedules(page);
  expect(schedules).toContainEqual({
    id: 'smith-bohdan',
    activity: 'working',
    locationId: 'forge'
  });

  const body = page.locator('body');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue', 'Kovář Bohdan');
  await expect(body).toHaveAttribute('data-dialogue-id', 'bohdan-offer-first-steel');
  await expect(page.locator('#game-status')).toContainText('Na východní cestě se usadil lapka');
});

test('nejbližší plánovaný obyvatel nabídne vlastní ambientní dialog', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v2',
      JSON.stringify({
        version: 2,
        player: { x: 458, y: 405, health: 100, stamina: 100 },
        quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
        world: { dayClock: 45 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  });

  await continueGame(page);
  const schedules = await readNpcSchedules(page);
  expect(schedules).toContainEqual({
    id: 'guard-vojtech',
    activity: 'patrolling',
    locationId: 'market'
  });

  const body = page.locator('body');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue', 'Strážný Vojtěch');
  await expect(body).toHaveAttribute('data-dialogue-id', 'vojtech-ambient');
});

test('legacy save verze 1 se migruje do IndexedDB a pokračování jej obnoví', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v1',
      JSON.stringify({
        version: 1,
        player: { x: 412, y: 365, health: 77, stamina: 44 },
        quest: { id: 'first-steel', step: 'defeat-bandit', banditDefeated: false },
        savedAt: '2026-07-17T20:00:00.000Z'
      })
    );
  });

  await continueGame(page);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-health', '77');
  await expect(body).toHaveAttribute('data-stamina', '44');
  await expect(page.locator('#game-status')).toContainText('Vyžeň lapku');

  const stored = await page.evaluate<StoredBrowserSave | null>(
    () =>
      new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('chronicles-of-bohemia', 1);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction('saves', 'readonly');
          const getRequest = transaction.objectStore('saves').get('primary');
          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => {
            const record = getRequest.result as { payload?: StoredBrowserSave } | undefined;
            resolve(record?.payload ?? null);
            database.close();
          };
        };
      })
  );

  expect(stored?.version).toBe(2);
  expect(stored?.world.dayClock).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('chronicles-of-bohemia.save.v1'))).toBeNull();
});
