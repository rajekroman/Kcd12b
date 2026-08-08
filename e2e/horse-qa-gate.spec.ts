import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface Position {
  x: number;
  y: number;
}

interface HorseSnapshot {
  worldFlags: Record<string, boolean>;
  counters: Record<string, number>;
  appliedIdempotencyKeys: string[];
  selectedSolution: 'lawful_service' | 'covert_release' | null;
  mountedActorId: string | null;
  failed: boolean;
  completed: boolean;
}

const HORSE_STORAGE_KEY = 'chronicles.horse-runtime.v1';
const HORSE_HOME = { x: 620, y: 350 };
const LAWFUL_GATE = { x: 555, y: 330 };
const LAWFUL_HERBS = { x: 500, y: 390 };
const OWNER_APPROVAL = { x: 610, y: 295 };
const CHECKPOINT_ONE = { x: 760, y: 350 };

const merchant = {
  id: 'trader-katerina',
  groschen: 500,
  stock: [
    { itemId: 'wood-axe', quantity: 1 },
    { itemId: 'padded-jack', quantity: 1 },
    { itemId: 'bread', quantity: 8 },
    { itemId: 'bandage', quantity: 5 },
  ],
};

const isMobileProject = (projectName: string): boolean => projectName.startsWith('iphone-');

const installBaseSave = async (page: Page, position: Position): Promise<void> => {
  await page.addInitScript(({ initialPosition, initialMerchant }) => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v5',
      JSON.stringify({
        version: 5,
        player: { x: initialPosition.x, y: initialPosition.y, health: 100, stamina: 100 },
        quest: { id: 'first-steel', step: 'complete', banditDefeated: true },
        world: { dayClock: 35, huntedAnimals: [] },
        economy: {
          inventory: {
            groschen: 85,
            maxWeight: 25,
            items: [{ itemId: 'bohdan-sword', quantity: 1 }],
            equipment: { weapon: 'bohdan-sword', armor: null, accessory: null },
          },
          merchant: initialMerchant,
        },
        reputation: { peasants: 15, townsfolk: 8, nobility: 2 },
        savedAt: '2026-08-08T10:00:00.000Z',
      }),
    );
  }, { initialPosition: position, initialMerchant: merchant });
};

const continueGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await expect(body).toHaveAttribute('data-has-save', 'true');
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are unavailable.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.77);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-horse-ready', 'true');
};

const readHorse = (page: Page): Promise<HorseSnapshot | null> =>
  page.evaluate((key) => {
    const serialized = localStorage.getItem(key);
    return serialized ? JSON.parse(serialized) as HorseSnapshot : null;
  }, HORSE_STORAGE_KEY);

const expectHorse = async (
  page: Page,
  predicate: (snapshot: HorseSnapshot) => boolean,
): Promise<HorseSnapshot> => {
  await expect.poll(async () => {
    const snapshot = await readHorse(page);
    return snapshot ? predicate(snapshot) : false;
  }).toBe(true);
  const snapshot = await readHorse(page);
  if (!snapshot) throw new Error('Horse runtime snapshot is missing.');
  return snapshot;
};

const pressInteract = async (page: Page, testInfo: TestInfo): Promise<void> => {
  if (isMobileProject(testInfo.project.name)) {
    const button = page.locator('[data-control="interact"]');
    await expect(button).toBeVisible();
    await button.tap();
    return;
  }
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are unavailable for keyboard interaction.');
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.keyboard.down('e');
  await page.waitForTimeout(80);
  await page.keyboard.up('e');
};

const repositionPrimarySave = async (page: Page, position: Position): Promise<void> => {
  await page.evaluate(async ({ x, y }) => {
    const request = indexedDB.open('chronicles-of-bohemia', 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('saves', 'readwrite');
    const store = transaction.objectStore('saves');
    const getRequest = store.get('primary');
    const record = await new Promise<{ id: string; payload: { player: Position } }>((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    record.payload.player.x = x;
    record.payload.player.y = y;
    store.put(record);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }, position);
};

const reloadAt = async (page: Page, position: Position): Promise<void> => {
  await repositionPrimarySave(page, position);
  await page.reload();
  await continueGame(page);
};

const prepareLawfulClaim = async (page: Page, testInfo: TestInfo): Promise<void> => {
  await installBaseSave(page, HORSE_HOME);
  await continueGame(page);

  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.inspected']);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.fed']);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.trust_earned']);

  await reloadAt(page, LAWFUL_GATE);
  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) => snapshot.selectedSolution === 'lawful_service' && snapshot.worldFlags['stable.radovesice.gate_repaired'],
  );

  await reloadAt(page, LAWFUL_HERBS);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['stable.radovesice.herbs_delivered']);

  await reloadAt(page, OWNER_APPROVAL);
  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) => snapshot.worldFlags['horse.jiskra.claimed'] && snapshot.worldFlags['horse.jiskra.mount_unlocked'],
  );
  await reloadAt(page, HORSE_HOME);
};

const attachEvidence = async (page: Page, testInfo: TestInfo, name: string): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-${name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
};

test('active mounted trial survives reload without duplicating idempotency state', async ({ page }, testInfo) => {
  await prepareLawfulClaim(page, testInfo);
  await pressInteract(page, testInfo);
  const mounted = await expectHorse(
    page,
    (snapshot) => snapshot.mountedActorId === 'player.henry' && snapshot.worldFlags['horse.jiskra.trial_started'],
  );
  const keyCountBeforeCheckpoint = mounted.appliedIdempotencyKeys.length;

  await reloadAt(page, CHECKPOINT_ONE);
  const checkpoint = await expectHorse(
    page,
    (snapshot) => snapshot.mountedActorId === 'player.henry' && snapshot.counters['horse.jiskra.trial_checkpoint_index'] === 1,
  );
  const keyCountAfterCheckpoint = checkpoint.appliedIdempotencyKeys.length;
  expect(keyCountAfterCheckpoint).toBeGreaterThanOrEqual(keyCountBeforeCheckpoint);

  await page.reload();
  await continueGame(page);
  const restored = await expectHorse(
    page,
    (snapshot) => snapshot.mountedActorId === 'player.henry' && snapshot.counters['horse.jiskra.trial_checkpoint_index'] === 1,
  );
  expect(restored.worldFlags['horse.jiskra.trial_started']).toBe(true);
  expect(restored.appliedIdempotencyKeys).toHaveLength(keyCountAfterCheckpoint);
  await attachEvidence(page, testInfo, 'active-trial-reloaded');
});

test('inventory modal owns input and prevents horse interact until closed', async ({ page }, testInfo) => {
  await prepareLawfulClaim(page, testInfo);

  if (isMobileProject(testInfo.project.name)) {
    await page.locator('[data-control="inventory"]').tap();
  } else {
    await page.keyboard.press('i');
  }
  await expect(page.locator('#economy-overlay')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'true');

  if (isMobileProject(testInfo.project.name)) {
    await expect(page.locator('[data-control="interact"]')).toBeHidden();
  } else {
    await pressInteract(page, testInfo);
  }
  expect((await expectHorse(page, () => true)).mountedActorId).toBeNull();

  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'false');
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.mountedActorId === 'player.henry');
  await attachEvidence(page, testInfo, 'inventory-input-ownership');
});

test('repeated reload keeps a single interact effect and emits no page or console errors', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await prepareLawfulClaim(page, testInfo);
  for (let index = 0; index < 3; index += 1) {
    await page.reload();
    await continueGame(page);
  }

  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.mountedActorId === 'player.henry');
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.mountedActorId === null);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await attachEvidence(page, testInfo, 'reload-listener-stability');
});