import { expect, test, type Page, type TestInfo } from '@playwright/test';

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

const installState = async (page: Page, horse: HorseSnapshot): Promise<void> => {
  await page.addInitScript(({ horseSnapshot, initialMerchant, horseStorageKey }) => {
    localStorage.setItem(horseStorageKey, JSON.stringify(horseSnapshot));
    localStorage.setItem(
      'chronicles-of-bohemia.save.v5',
      JSON.stringify({
        version: 5,
        player: { x: 620, y: 350, health: 100, stamina: 100 },
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
  }, { horseSnapshot: horse, initialMerchant: merchant, horseStorageKey: HORSE_STORAGE_KEY });
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

const readHorse = (page: Page): Promise<HorseSnapshot> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as HorseSnapshot, HORSE_STORAGE_KEY);

const pressInteract = async (page: Page, testInfo: TestInfo): Promise<void> => {
  if (testInfo.project.name.startsWith('iphone-')) {
    const button = page.locator('[data-control="interact"]');
    await expect(button).toBeVisible();
    await button.tap();
    return;
  }
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are unavailable.');
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.keyboard.press('e');
};

const attachEvidence = async (page: Page, testInfo: TestInfo, name: string): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-${name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
};

test('active mounted trial survives reload without duplicating idempotency state', async ({ page }, testInfo) => {
  const initial: HorseSnapshot = {
    worldFlags: {
      'horse.jiskra.claimed': true,
      'horse.jiskra.mount_unlocked': true,
      'horse.jiskra.trial_started': true,
    },
    counters: {
      'horse.jiskra.trust_points': 3,
      'horse.jiskra.trial_checkpoint_index': 1,
    },
    appliedIdempotencyKeys: ['qa.trial.active'],
    selectedSolution: 'lawful_service',
    mountedActorId: 'player.henry',
    failed: false,
    completed: false,
  };
  await installState(page, initial);
  await continueGame(page);
  await expect(page.locator('body')).toHaveAttribute('data-horse-mounted', 'player.henry');
  await expect(page.locator('body')).toHaveAttribute('data-horse-trial-active', 'true');
  await page.reload();
  await continueGame(page);
  const restored = await readHorse(page);
  expect(restored.mountedActorId).toBe('player.henry');
  expect(restored.worldFlags['horse.jiskra.trial_started']).toBe(true);
  expect(restored.counters['horse.jiskra.trial_checkpoint_index']).toBe(1);
  expect(restored.appliedIdempotencyKeys).toEqual(initial.appliedIdempotencyKeys);
  await attachEvidence(page, testInfo, 'active-trial-reloaded');
});

test('inventory modal owns input and prevents horse interact until closed', async ({ page }, testInfo) => {
  const initial: HorseSnapshot = {
    worldFlags: {
      'horse.jiskra.claimed': true,
      'horse.jiskra.mount_unlocked': true,
    },
    counters: { 'horse.jiskra.trust_points': 3 },
    appliedIdempotencyKeys: [],
    selectedSolution: 'lawful_service',
    mountedActorId: null,
    failed: false,
    completed: false,
  };
  await installState(page, initial);
  await continueGame(page);

  if (testInfo.project.name.startsWith('iphone-')) {
    await page.locator('[data-control="inventory"]').tap();
  } else {
    await page.keyboard.press('i');
  }
  await expect(page.locator('#economy-overlay')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'true');
  await page.keyboard.press('e');
  expect((await readHorse(page)).mountedActorId).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-economy-open', 'false');

  await pressInteract(page, testInfo);
  await expect.poll(async () => (await readHorse(page)).mountedActorId).toBe('player.henry');
  await attachEvidence(page, testInfo, 'inventory-input-ownership');
});

test('repeated reload keeps a single interact effect and emits no page or console errors', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await installState(page, {
    worldFlags: {
      'horse.jiskra.claimed': true,
      'horse.jiskra.mount_unlocked': true,
    },
    counters: { 'horse.jiskra.trust_points': 3 },
    appliedIdempotencyKeys: [],
    selectedSolution: 'lawful_service',
    mountedActorId: null,
    failed: false,
    completed: false,
  });
  await continueGame(page);

  for (let index = 0; index < 3; index += 1) {
    await page.reload();
    await continueGame(page);
  }

  await pressInteract(page, testInfo);
  await expect.poll(async () => (await readHorse(page)).mountedActorId).toBe('player.henry');
  await pressInteract(page, testInfo);
  await expect.poll(async () => (await readHorse(page)).mountedActorId).toBeNull();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await attachEvidence(page, testInfo, 'reload-listener-stability');
});