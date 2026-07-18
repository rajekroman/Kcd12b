import { expect, test, type Page } from '@playwright/test';

interface StoredBrowserSave {
  version: number;
  player: { health: number; stamina: number };
  world: { dayClock: number };
  economy: {
    inventory: {
      groschen: number;
      equipment: { weapon: string | null };
      items: Array<{ itemId: string; quantity: number }>;
    };
  };
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

const readStoredSave = async (page: Page): Promise<StoredBrowserSave | null> =>
  page.evaluate<StoredBrowserSave | null>(
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
  await expect(body).toHaveAttribute('data-groschen', '85');
  await expect(body).toHaveAttribute('data-equipped-weapon', 'bohdan-sword');
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

test('přechod menu → hra spustí HUD, ekonomiku a deset ranních obyvatel', async ({
  page
}, testInfo) => {
  await startNewGame(page);

  const controls = page.locator('#mobile-controls');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(controls).toBeVisible();
    await expect(page.locator('[data-control="block"]')).toBeVisible();
    await expect(page.locator('[data-control="dodge"]')).toBeVisible();
    await expect(page.locator('[data-control="inventory"]')).toBeVisible();
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
});

test('inventář se otevře, zobrazí výbavu a bezpečně se zavře', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');

  await page.keyboard.press('i');
  await expect(body).toHaveAttribute('data-economy-open', 'true');
  await expect(body).toHaveAttribute('data-economy-mode', 'inventory');
  await expect(page.locator('#economy-overlay')).toBeVisible();
  await expect(page.locator('[data-item="bohdan-sword"]')).toContainText('Bohdanův cvičný meč');
  await expect(page.locator('#economy-summary')).toContainText('85');

  await page.keyboard.press('Escape');
  await expect(body).toHaveAttribute('data-economy-open', 'false');
  await expect(page.locator('#economy-overlay')).toBeHidden();
});

test('spotřební předmět obnoví zdraví a okamžitě vyvolá save', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v2',
      JSON.stringify({
        version: 2,
        player: { x: 240, y: 390, health: 70, stamina: 100 },
        quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
        world: { dayClock: 35 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  });

  await continueGame(page);
  const body = page.locator('body');
  await page.keyboard.press('i');
  await page.locator('[data-item="bandage"] [data-economy-action="use"]').click();

  await expect(body).toHaveAttribute('data-health', '82');
  await expect(body).toHaveAttribute('data-last-save', 'ok');
  await expect(page.locator('[data-item="bandage"]')).toHaveCount(0);
});

test('nákup u Kateřiny a vybavení nové zbraně se uloží do verze 3', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v2',
      JSON.stringify({
        version: 2,
        player: { x: 480, y: 395, health: 100, stamina: 100 },
        quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
        world: { dayClock: 45 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  });

  await continueGame(page);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-near-npc', 'trader-katerina');

  await page.keyboard.press('i');
  await expect(body).toHaveAttribute('data-economy-mode', 'trade');
  await page.locator('[data-item="wood-axe"] [data-economy-action="buy"]').click();
  await expect(body).toHaveAttribute('data-groschen', '3');

  await page.locator('[data-economy-tab="inventory"]').click();
  await page.locator('[data-item="wood-axe"] [data-economy-action="equip"]').click();
  await expect(body).toHaveAttribute('data-equipped-weapon', 'wood-axe');
  await expect(body).toHaveAttribute('data-last-save', 'ok');

  const stored = await readStoredSave(page);
  expect(stored?.version).toBe(3);
  expect(stored?.economy.inventory.groschen).toBe(3);
  expect(stored?.economy.inventory.equipment.weapon).toBe('wood-axe');
  expect(stored?.economy.inventory.items).toContainEqual({ itemId: 'wood-axe', quantity: 1 });
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
  const body = page.locator('body');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue', 'Kovář Bohdan');
  await expect(body).toHaveAttribute('data-dialogue-id', 'bohdan-offer-first-steel');
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
  const body = page.locator('body');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue', 'Strážný Vojtěch');
  await expect(body).toHaveAttribute('data-dialogue-id', 'vojtech-ambient');
});

test('legacy save verze 1 se migruje do IndexedDB verze 3 s ekonomikou', async ({ page }) => {
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
  await expect(body).toHaveAttribute('data-groschen', '85');
  await expect(page.locator('#game-status')).toContainText('Vyžeň lapku');

  const stored = await readStoredSave(page);
  expect(stored?.version).toBe(3);
  expect(stored?.world.dayClock).toBe(0);
  expect(stored?.economy.inventory.groschen).toBe(85);
  expect(await page.evaluate(() => localStorage.getItem('chronicles-of-bohemia.save.v1'))).toBeNull();
});
