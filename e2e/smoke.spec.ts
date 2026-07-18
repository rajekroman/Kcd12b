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
  reputation: {
    peasants: number;
    townsfolk: number;
    nobility: number;
  };
}

interface NpcScheduleSnapshot {
  id: string;
  activity: string;
  locationId: string;
}

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

const installSave = async (page: Page, key: string, save: unknown): Promise<void> => {
  await page.addInitScript(
    ({ storageKey, payload }) => {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    { storageKey: key, payload: save }
  );
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
  await expect(body).toHaveAttribute('data-groschen', '85');
  await expect(body).toHaveAttribute('data-equipped-weapon', 'bohdan-sword');
  await expect(body).toHaveAttribute('data-reputation-peasants', '0');
  await expect(body).toHaveAttribute('data-reputation-townsfolk', '0');
  await expect(body).toHaveAttribute('data-reputation-nobility', '0');
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

test('přechod menu → hra spustí HUD, ekonomiku, pověst a deset obyvatel', async ({
  page
}, testInfo) => {
  await startNewGame(page);

  const controls = page.locator('#mobile-controls');
  if (testInfo.project.name === 'mobile-chromium') {
    await expect(controls).toBeVisible();
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
});

test('inventář zobrazí výbavu a tři reputační skupiny', async ({ page }) => {
  await startNewGame(page);
  const body = page.locator('body');

  await page.keyboard.press('i');
  await expect(body).toHaveAttribute('data-economy-open', 'true');
  await expect(page.locator('#economy-overlay')).toBeVisible();
  await expect(page.locator('[data-item="bohdan-sword"]')).toContainText('Bohdanův cvičný meč');
  await expect(page.locator('[data-reputation-faction]')).toHaveCount(3);
  await expect(page.locator('[data-reputation-faction="townsfolk"]')).toContainText('neutrální');

  await page.keyboard.press('Escape');
  await expect(body).toHaveAttribute('data-economy-open', 'false');
});

test('spotřební předmět obnoví zdraví a okamžitě vyvolá save verze 4', async ({ page }) => {
  await installSave(page, 'chronicles-of-bohemia.save.v2', {
    version: 2,
    player: { x: 240, y: 390, health: 70, stamina: 100 },
    quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
    world: { dayClock: 35 },
    savedAt: '2026-07-18T08:00:00.000Z'
  });

  await continueGame(page);
  const body = page.locator('body');
  await page.keyboard.press('i');
  await page.locator('[data-item="bandage"] [data-economy-action="use"]').click();

  await expect(body).toHaveAttribute('data-health', '82');
  await expect(body).toHaveAttribute('data-last-save', 'ok');
  expect((await readStoredSave(page))?.version).toBe(4);
});

test('neutrální nákup a vybavení nové zbraně se uloží do verze 4', async ({ page }) => {
  await installSave(page, 'chronicles-of-bohemia.save.v2', {
    version: 2,
    player: { x: 480, y: 395, health: 100, stamina: 100 },
    quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
    world: { dayClock: 45 },
    savedAt: '2026-07-18T08:00:00.000Z'
  });

  await continueGame(page);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-near-npc', 'trader-katerina');

  await page.keyboard.press('i');
  await page.locator('[data-item="wood-axe"] [data-economy-action="buy"]').click();
  await expect(body).toHaveAttribute('data-groschen', '3');

  await page.locator('[data-economy-tab="inventory"]').click();
  await page.locator('[data-item="wood-axe"] [data-economy-action="equip"]').click();
  await expect(body).toHaveAttribute('data-equipped-weapon', 'wood-axe');
  await expect(body).toHaveAttribute('data-last-save', 'ok');

  const stored = await readStoredSave(page);
  expect(stored?.version).toBe(4);
  expect(stored?.economy.inventory.groschen).toBe(3);
  expect(stored?.reputation).toEqual({ peasants: 0, townsfolk: 0, nobility: 0 });
});

test('ctěná měšťanská pověst zlevní Kateřininu sekeru a změní dialog', async ({ page }) => {
  await installSave(page, 'chronicles-of-bohemia.save.v4', {
    version: 4,
    player: { x: 480, y: 395, health: 100, stamina: 100 },
    quest: { id: 'first-steel', step: 'complete', banditDefeated: true },
    world: { dayClock: 45 },
    economy: initialEconomy,
    reputation: { peasants: 40, townsfolk: 60, nobility: 5 },
    savedAt: '2026-07-18T08:00:00.000Z'
  });

  await continueGame(page);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-townsfolk-tier', 'honored');

  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue-id', 'katerina-honored');

  await page.keyboard.press('Escape');
  await page.keyboard.press('i');
  await expect(page.locator('[data-item="wood-axe"] [data-economy-action="buy"]')).toContainText('73');
  await page.locator('[data-item="wood-axe"] [data-economy-action="buy"]').click();
  await expect(body).toHaveAttribute('data-groschen', '12');
});

test('dokončení První oceli přidá reputační odměnu právě jednou a uloží ji', async ({ page }) => {
  await installSave(page, 'chronicles-of-bohemia.save.v4', {
    version: 4,
    player: { x: 370, y: 340, health: 100, stamina: 100 },
    quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: true },
    world: { dayClock: 45 },
    economy: initialEconomy,
    reputation: { peasants: 0, townsfolk: 0, nobility: 0 },
    savedAt: '2026-07-18T08:00:00.000Z'
  });

  await continueGame(page);
  const body = page.locator('body');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue-id', 'bohdan-report-early-victory');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.91, bounds.y + bounds.height * 0.79);

  await expect(body).toHaveAttribute('data-reputation-peasants', '15');
  await expect(body).toHaveAttribute('data-reputation-townsfolk', '8');
  await expect(body).toHaveAttribute('data-reputation-nobility', '2');
  await expect(body).toHaveAttribute('data-last-save', 'ok');

  const stored = await readStoredSave(page);
  expect(stored?.reputation).toEqual({ peasants: 15, townsfolk: 8, nobility: 2 });
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
  await page.keyboard.press('Shift');
  await expect(body).toHaveAttribute('data-last-message', 'Úhyb.');
});

test('legacy save verze 1 se migruje do IndexedDB verze 4', async ({ page }) => {
  await installSave(page, 'chronicles-of-bohemia.save.v1', {
    version: 1,
    player: { x: 412, y: 365, health: 77, stamina: 44 },
    quest: { id: 'first-steel', step: 'defeat-bandit', banditDefeated: false },
    savedAt: '2026-07-17T20:00:00.000Z'
  });

  await continueGame(page);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-health', '77');
  await expect(body).toHaveAttribute('data-groschen', '85');
  await expect(body).toHaveAttribute('data-reputation-townsfolk', '0');

  const stored = await readStoredSave(page);
  expect(stored?.version).toBe(4);
  expect(stored?.world.dayClock).toBe(0);
  expect(stored?.reputation).toEqual({ peasants: 0, townsfolk: 0, nobility: 0 });
});
