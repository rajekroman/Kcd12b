import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface HorseSnapshot {
  questId: string;
  horseId: string;
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

const claimedHorse = (): HorseSnapshot => ({
  questId: 'quest.first_horse.oak_and_reins',
  horseId: 'horse.dun_mare_jiskra',
  worldFlags: {
    'horse.jiskra.inspected': true,
    'horse.jiskra.fed': true,
    'horse.jiskra.groomed': true,
    'horse.jiskra.trust_earned': true,
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

const installState = async (page: Page): Promise<void> => {
  await page.addInitScript(
    ({ horseSnapshot, horseStorageKey, initialMerchant }) => {
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
          savedAt: '2026-08-08T11:10:00.000Z',
        }),
      );
    },
    {
      horseSnapshot: claimedHorse(),
      horseStorageKey: HORSE_STORAGE_KEY,
      initialMerchant: merchant,
    },
  );
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
  await expect(body).toHaveAttribute('data-horse-mounted', '');
};

const isMobileProject = (projectName: string): boolean => projectName.startsWith('iphone-');

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
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  await page.keyboard.down('e');
  await page.waitForTimeout(80);
  await page.keyboard.up('e');
};

const attachEvidence = async (page: Page, testInfo: TestInfo): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-horse-modal-input-ownership`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
};

test('inventory modal owns horse interact on keyboard and touch', async ({ page }, testInfo) => {
  await installState(page);
  await continueGame(page);

  const body = page.locator('body');
  const overlay = page.locator('#economy-overlay');
  const interact = page.locator('[data-control="interact"]');

  if (isMobileProject(testInfo.project.name)) {
    const inventory = page.locator('[data-control="inventory"]');
    await expect(inventory).toBeVisible();
    await inventory.tap();
  } else {
    await page.keyboard.press('i');
  }

  await expect(body).toHaveAttribute('data-economy-open', 'true');
  await expect(overlay).toBeVisible();

  if (isMobileProject(testInfo.project.name)) {
    await expect(interact).toBeHidden();
    await page.waitForTimeout(250);
  } else {
    await page.keyboard.press('e');
    await page.waitForTimeout(250);
  }

  await expect(body).toHaveAttribute('data-horse-mounted', '');
  await expect(body).not.toHaveAttribute('data-horse-action', 'mount');
  await attachEvidence(page, testInfo);

  await page.keyboard.press('Escape');
  await expect(body).toHaveAttribute('data-economy-open', 'false');
  await pressInteract(page, testInfo);
  await expect(body).toHaveAttribute('data-horse-mounted', 'player.henry');
});
