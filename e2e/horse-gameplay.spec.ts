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
const COVERT_GATE = { x: 670, y: 330 };
const TRIAL_RESTART_POINT = { x: 700, y: 350 };
const CHECKPOINTS = [
  { x: 760, y: 350 },
  { x: 920, y: 430 },
  { x: 1040, y: 300 }
] as const;

const merchant = {
  id: 'trader-katerina',
  groschen: 500,
  stock: [
    { itemId: 'wood-axe', quantity: 1 },
    { itemId: 'padded-jack', quantity: 1 },
    { itemId: 'bread', quantity: 8 },
    { itemId: 'bandage', quantity: 5 }
  ]
};

const isMobileProject = (projectName: string): boolean => projectName.startsWith('iphone-');

const attachEvidence = async (page: Page, testInfo: TestInfo, name: string): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-${name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
};

const installBaseSave = async (page: Page, position: Position, dayClock = 35): Promise<void> => {
  await page.addInitScript(({ position: initialPosition, dayClock: initialDayClock, merchant: initialMerchant }) => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v5',
      JSON.stringify({
        version: 5,
        player: { x: initialPosition.x, y: initialPosition.y, health: 100, stamina: 100 },
        quest: { id: 'first-steel', step: 'complete', banditDefeated: true },
        world: { dayClock: initialDayClock, huntedAnimals: [] },
        economy: {
          inventory: {
            groschen: 85,
            maxWeight: 25,
            items: [{ itemId: 'bohdan-sword', quantity: 1 }],
            equipment: { weapon: 'bohdan-sword', armor: null, accessory: null }
          },
          merchant: initialMerchant
        },
        reputation: { peasants: 15, townsfolk: 8, nobility: 2 },
        savedAt: '2026-07-31T01:00:00.000Z'
      })
    );
  }, { position, dayClock, merchant });
};

const continueGame = async (page: Page): Promise<void> => {
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
  await expect(body).toHaveAttribute('data-horse-ready', 'true');
};

const readHorseSnapshot = (page: Page): Promise<HorseSnapshot | null> =>
  page.evaluate((key) => {
    const serialized = localStorage.getItem(key);
    return serialized ? JSON.parse(serialized) as HorseSnapshot : null;
  }, HORSE_STORAGE_KEY);

const expectHorse = async (
  page: Page,
  predicate: (snapshot: HorseSnapshot) => boolean
): Promise<HorseSnapshot> => {
  await expect.poll(async () => {
    const snapshot = await readHorseSnapshot(page);
    return snapshot ? predicate(snapshot) : false;
  }).toBe(true);
  const snapshot = await readHorseSnapshot(page);
  if (!snapshot) throw new Error('Horse runtime snapshot is missing.');
  return snapshot;
};

const pressInteract = async (page: Page, testInfo: TestInfo): Promise<void> => {
  if (!isMobileProject(testInfo.project.name)) {
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error('Canvas bounds are not available for keyboard interaction.');
    await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
    await page.keyboard.down('e');
    await page.waitForTimeout(80);
    await page.keyboard.up('e');
    return;
  }
  const button = page.locator('[data-control="interact"]');
  await expect(button).toBeVisible();
  await button.tap();
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

const holdMountedSprint = async (page: Page, testInfo: TestInfo): Promise<void> => {
  if (!isMobileProject(testInfo.project.name)) {
    await page.keyboard.down('Shift');
    await page.keyboard.down('d');
    await expect.poll(async () => Number(await page.locator('body').getAttribute('data-horse-stamina'))).toBeLessThan(100);
    await page.keyboard.up('d');
    await page.keyboard.up('Shift');
    return;
  }

  const right = page.locator('[data-control="right"]');
  const sprint = page.locator('[data-control="dodge"]');
  await expect(right).toBeVisible();
  await expect(sprint).toBeVisible();
  const rightBounds = await right.boundingBox();
  const sprintBounds = await sprint.boundingBox();
  if (!rightBounds || !sprintBounds) throw new Error('Mobile horse control bounds are unavailable.');

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      {
        x: rightBounds.x + rightBounds.width / 2,
        y: rightBounds.y + rightBounds.height / 2,
        id: 41,
        radiusX: 3,
        radiusY: 3,
        force: 1
      },
      {
        x: sprintBounds.x + sprintBounds.width / 2,
        y: sprintBounds.y + sprintBounds.height / 2,
        id: 42,
        radiusX: 3,
        radiusY: 3,
        force: 1
      }
    ]
  });
  try {
    await expect.poll(async () => Number(await page.locator('body').getAttribute('data-horse-stamina'))).toBeLessThan(100);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  }
};

test('lawful horse path mounts, resets, reloads and completes the ordered trial', async ({ page }, testInfo) => {
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
    (snapshot) =>
      snapshot.selectedSolution === 'lawful_service' &&
      snapshot.worldFlags['stable.radovesice.gate_repaired']
  );

  await reloadAt(page, LAWFUL_HERBS);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['stable.radovesice.herbs_delivered']);

  await reloadAt(page, OWNER_APPROVAL);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.claimed']);

  await reloadAt(page, HORSE_HOME);
  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) =>
      snapshot.mountedActorId === 'player.henry' && snapshot.worldFlags['horse.jiskra.trial_started']
  );
  await holdMountedSprint(page, testInfo);
  await attachEvidence(page, testInfo, 'horse-mounted-sprint');

  await reloadAt(page, CHECKPOINTS[0]);
  await expectHorse(page, (snapshot) => snapshot.counters['horse.jiskra.trial_checkpoint_index'] === 1);
  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) =>
      snapshot.mountedActorId === null &&
      !snapshot.worldFlags['horse.jiskra.trial_started'] &&
      snapshot.counters['horse.jiskra.trial_checkpoint_index'] === 0
  );

  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) =>
      snapshot.mountedActorId === 'player.henry' && snapshot.worldFlags['horse.jiskra.trial_started']
  );

  await reloadAt(page, CHECKPOINTS[1]);
  await expectHorse(
    page,
    (snapshot) =>
      !snapshot.worldFlags['horse.jiskra.trial_started'] &&
      snapshot.counters['horse.jiskra.trial_checkpoint_index'] === 0
  );
  await reloadAt(page, TRIAL_RESTART_POINT);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.trial_started']);

  for (let index = 0; index < CHECKPOINTS.length; index += 1) {
    await reloadAt(page, CHECKPOINTS[index]);
    await expectHorse(
      page,
      (snapshot) => snapshot.counters['horse.jiskra.trial_checkpoint_index'] === index + 1
    );
  }

  await reloadAt(page, HORSE_HOME);
  const completed = await expectHorse(page, (snapshot) => snapshot.completed);
  expect(completed.worldFlags['horse.jiskra.trial_completed']).toBe(true);
  expect(completed.worldFlags['horse.jiskra.trial_started']).toBe(false);
  const keyCount = completed.appliedIdempotencyKeys.length;
  await page.reload();
  await continueGame(page);
  const reloaded = await expectHorse(page, (snapshot) => snapshot.completed);
  expect(reloaded.appliedIdempotencyKeys).toHaveLength(keyCount);
  await attachEvidence(page, testInfo, 'horse-trial-completed-reloaded');
});

test('covert horse acquisition remains claimed after reload', async ({ page }, testInfo) => {
  await installBaseSave(page, HORSE_HOME, 35);
  await continueGame(page);

  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.inspected']);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.fed']);
  await pressInteract(page, testInfo);
  await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.trust_earned']);

  await reloadAt(page, COVERT_GATE);
  await pressInteract(page, testInfo);
  await expectHorse(
    page,
    (snapshot) =>
      snapshot.selectedSolution === 'covert_release' &&
      snapshot.worldFlags['stable.radovesice.gate_opened_covertly']
  );

  await reloadAt(page, HORSE_HOME);
  await pressInteract(page, testInfo);
  const claimed = await expectHorse(
    page,
    (snapshot) =>
      snapshot.selectedSolution === 'covert_release' && snapshot.worldFlags['horse.jiskra.claimed']
  );
  const keyCount = claimed.appliedIdempotencyKeys.length;

  await page.reload();
  await continueGame(page);
  const restored = await expectHorse(page, (snapshot) => snapshot.worldFlags['horse.jiskra.claimed']);
  expect(restored.selectedSolution).toBe('covert_release');
  expect(restored.appliedIdempotencyKeys).toHaveLength(keyCount);
  await attachEvidence(page, testInfo, 'horse-covert-reloaded');
});
