import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface Position {
  x: number;
  y: number;
}

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
const HORSE_HOME = { x: 620, y: 350 };
const OUTSIDE_TRIAL_ROUTE = { x: 240, y: 180 };

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

const snapshot = (overrides: Partial<HorseSnapshot> = {}): HorseSnapshot => ({
  questId: 'quest.first_horse.oak_and_reins',
  horseId: 'horse.dun_mare_jiskra',
  worldFlags: {},
  counters: {},
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  mountedActorId: null,
  failed: false,
  completed: false,
  ...overrides,
});

const installState = async (
  page: Page,
  horse: HorseSnapshot,
  position: Position = HORSE_HOME,
): Promise<void> => {
  await page.addInitScript(
    ({ horseSnapshot, initialPosition, initialMerchant, horseStorageKey }) => {
      localStorage.setItem(horseStorageKey, JSON.stringify(horseSnapshot));
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
          savedAt: '2026-08-07T17:00:00.000Z',
        }),
      );
    },
    {
      horseSnapshot: horse,
      initialPosition: position,
      initialMerchant: merchant,
      horseStorageKey: HORSE_STORAGE_KEY,
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
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.77);
  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
  await expect(body).toHaveAttribute('data-horse-ready', 'true');
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
  if (!bounds) throw new Error('Canvas bounds are not available for keyboard interaction.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  await page.keyboard.down('e');
  await page.waitForTimeout(80);
  await page.keyboard.up('e');
};

const attachEvidence = async (page: Page, testInfo: TestInfo, name: string): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-${name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
};

const expectInsideViewport = async (page: Page): Promise<void> => {
  const hud = page.locator('[data-horse-hud="true"]');
  const box = await hud.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('Horse HUD bounds are unavailable.');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
};

test('horse HUD stays read-only, safe-area bounded and hides mount status before unlock', async ({ page }, testInfo) => {
  const initial = snapshot({
    worldFlags: {
      'horse.jiskra.claimed': true,
      'horse.jiskra.mount_unlocked': false,
    },
    counters: { 'horse.jiskra.trust_points': 3 },
    selectedSolution: 'lawful_service',
  });
  await installState(page, initial);
  await continueGame(page);

  const hud = page.locator('[data-horse-hud="true"]');
  await expect(hud).toBeVisible();
  await expect(hud).toHaveAttribute('aria-label', 'Stav koně');
  await expect(hud).toHaveAttribute('data-mount-unlocked', 'false');
  await expect(hud.locator('[data-horse-hud-trust]')).toHaveText('Důvěra 3/3');
  await expect(hud.locator('[data-horse-hud-mount]')).toBeHidden();
  await expect(hud.locator('[data-horse-hud-feedback]')).toBeHidden();
  expect(await hud.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
  await expectInsideViewport(page);
  await attachEvidence(page, testInfo, 'horse-hud-pre-unlock');
});

test('rejected mount request keeps dedicated horse feedback visible across global message changes', async ({ page }, testInfo) => {
  await installState(
    page,
    snapshot({
      worldFlags: {
        'horse.jiskra.inspected': true,
        'horse.jiskra.fed': true,
        'horse.jiskra.groomed': true,
        'horse.jiskra.trust_earned': true,
        'horse.jiskra.claimed': true,
        'horse.jiskra.mount_unlocked': false,
      },
      counters: { 'horse.jiskra.trust_points': 3 },
      selectedSolution: 'lawful_service',
    }),
  );
  await continueGame(page);
  await pressInteract(page, testInfo);

  const body = page.locator('body');
  const feedback = page.locator('[data-horse-hud-feedback]');
  await expect(body).toHaveAttribute('data-horse-rejection', 'mount_not_unlocked');
  await expect(body).toHaveAttribute('data-horse-feedback', 'Nasednutí ještě není odemčené.');
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveText('Nasednutí ještě není odemčené.');
  await expect(body).toHaveAttribute('data-horse-mounted', '');

  await page.evaluate(() => {
    document.body.dataset.lastMessage = 'Podezření roste. Stráž tě sleduje.';
  });
  await expect(body).toHaveAttribute('data-last-message', 'Podezření roste. Stráž tě sleduje.');
  await expect(feedback).toHaveText('Nasednutí ještě není odemčené.');
  await attachEvidence(page, testInfo, 'horse-mount-rejection');
});

test('horse HUD shows authoritative mounted, gait, stamina and checkpoint state', async ({ page }, testInfo) => {
  await installState(
    page,
    snapshot({
      worldFlags: {
        'horse.jiskra.claimed': true,
        'horse.jiskra.mount_unlocked': true,
        'horse.jiskra.trial_started': true,
      },
      counters: {
        'horse.jiskra.trust_points': 3,
        'horse.jiskra.trial_checkpoint_index': 1,
      },
      selectedSolution: 'lawful_service',
      mountedActorId: 'player.henry',
    }),
  );
  await continueGame(page);

  const hud = page.locator('[data-horse-hud="true"]');
  await expect(hud).toBeVisible();
  await expect(hud).toHaveAttribute('data-mounted', 'true');
  await expect(hud).toHaveAttribute('data-mount-unlocked', 'true');
  await expect(hud.locator('[data-horse-hud-mount]')).toHaveText('Nasednuto');
  await expect(hud.locator('[data-horse-hud-trial]')).toHaveText('Trasa 1/3');
  await expect(hud.locator('[data-horse-hud-gait]')).toContainText('Chod:');
  await expect(hud.locator('[data-horse-hud-stamina]')).toContainText('Výdrž:');
  await expectInsideViewport(page);
  await attachEvidence(page, testInfo, 'horse-hud-mounted');
});

test('trial route reset publishes dedicated scoped reset feedback', async ({ page }, testInfo) => {
  await installState(
    page,
    snapshot({
      worldFlags: {
        'horse.jiskra.claimed': true,
        'horse.jiskra.mount_unlocked': true,
        'horse.jiskra.trial_started': true,
      },
      counters: {
        'horse.jiskra.trust_points': 3,
        'horse.jiskra.trial_checkpoint_index': 2,
      },
      selectedSolution: 'lawful_service',
      mountedActorId: 'player.henry',
    }),
    OUTSIDE_TRIAL_ROUTE,
  );
  await continueGame(page);

  const body = page.locator('body');
  const feedback = page.locator('[data-horse-hud-feedback]');
  await expect(body).toHaveAttribute(
    'data-horse-feedback',
    'Opustil jsi zkušební trasu. Checkpointy byly resetovány.',
  );
  await expect(feedback).toHaveText('Opustil jsi zkušební trasu. Checkpointy byly resetovány.');
  await expect(body).toHaveAttribute('data-horse-trial-active', 'false');
  await expect(body).toHaveAttribute('data-horse-trial-index', '0');
  await attachEvidence(page, testInfo, 'horse-trial-reset-feedback');
});

test('terminal horse failure keeps dedicated scoped feedback visible', async ({ page }, testInfo) => {
  await installState(
    page,
    snapshot({
      worldFlags: { 'horse.jiskra.injured': true },
      failed: true,
    }),
  );
  await continueGame(page);

  const body = page.locator('body');
  const hud = page.locator('[data-horse-hud="true"]');
  const feedback = hud.locator('[data-horse-hud-feedback]');
  await expect(hud).toBeVisible();
  await expect(hud).toHaveAttribute('data-failed', 'true');
  await expect(hud.locator('[data-horse-hud-status]')).toHaveText('Jezdecký úkol selhal.');

  await page.evaluate(() => {
    document.body.dataset.horseFeedback = 'Jiskra se zranila v nebezpečném boxu.';
  });
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveText('Jiskra se zranila v nebezpečném boxu.');

  await page.evaluate(() => {
    document.body.dataset.lastMessage = 'Podezření roste. Stráž tě sleduje.';
  });
  await expect(body).toHaveAttribute('data-last-message', 'Podezření roste. Stráž tě sleduje.');
  await expect(feedback).toHaveText('Jiskra se zranila v nebezpečném boxu.');
  await expectInsideViewport(page);
  await attachEvidence(page, testInfo, 'horse-hud-failure');
});
