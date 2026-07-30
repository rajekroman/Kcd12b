import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface CraftingSaveOptions {
  player: { x: number; y: number; health?: number };
  dayClock: number;
  items: Array<{ itemId: string; quantity: number }>;
  equipment?: { weapon: string | null; armor: string | null; accessory: string | null };
}

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

const attachEvidence = async (
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> => {
  await testInfo.attach(`${testInfo.project.name}-${name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
};

const installCraftingSave = async (
  page: Page,
  options: CraftingSaveOptions
): Promise<void> => {
  await page.addInitScript((value) => {
    localStorage.setItem(
      'chronicles-of-bohemia.save.v5',
      JSON.stringify({
        version: 5,
        player: {
          x: value.options.player.x,
          y: value.options.player.y,
          health: value.options.player.health ?? 100,
          stamina: 100
        },
        quest: { id: 'first-steel', step: 'complete', banditDefeated: true },
        world: { dayClock: value.options.dayClock, huntedAnimals: [] },
        economy: {
          inventory: {
            groschen: 85,
            maxWeight: 25,
            items: value.options.items,
            equipment: value.options.equipment ?? {
              weapon: 'bohdan-sword',
              armor: null,
              accessory: null
            }
          },
          merchant: value.merchant
        },
        reputation: { peasants: 15, townsfolk: 8, nobility: 2 },
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
  }, { options, merchant });
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
};

const openCrafting = async (page: Page, testInfo: TestInfo): Promise<void> => {
  if (isMobileProject(testInfo.project.name)) {
    const button = page.locator('[data-control="crafting"]');
    await expect(button).toBeVisible();
    await button.dispatchEvent('pointerdown', {
      pointerId: 4,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 1
    });
    await button.dispatchEvent('pointerup', {
      pointerId: 4,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 0
    });
  } else {
    await page.keyboard.press('c');
  }
  await expect(page.locator('#crafting-overlay')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-crafting-open', 'true');
};

const closeCrafting = async (page: Page): Promise<void> => {
  await page.locator('[data-crafting-close]').click();
  await expect(page.locator('#crafting-overlay')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-crafting-open', 'false');
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

test('Anežčina stanice vyrobí bylinný obklad a zachová ho po reloadu', async ({ page }, testInfo) => {
  await installCraftingSave(page, {
    player: { x: 145, y: 555, health: 60 },
    dayClock: 75,
    items: [
      { itemId: 'bohdan-sword', quantity: 1 },
      { itemId: 'healing-herbs', quantity: 2 },
      { itemId: 'bandage', quantity: 1 }
    ]
  });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-near-npc', 'herbalist-agnes');
  await expect(body).toHaveAttribute('data-crafting-available', 'alchemy');
  await openCrafting(page, testInfo);
  await expect(body).toHaveAttribute('data-crafting-station', 'alchemy');
  await expect(page.locator('[data-recipe="herbal-poultice"]')).toHaveAttribute(
    'data-craftable',
    'true'
  );

  await page.locator('[data-recipe="herbal-poultice"] [data-crafting-action="craft"]').click();
  await expect(body).toHaveAttribute('data-last-craft', 'herbal-poultice');
  await expect(body).toHaveAttribute('data-crafting-message', 'Bylinný obklad dokončen.');
  await expect(body).toHaveAttribute('data-last-save', 'ok');
  await expect(page.locator('[data-recipe="herbal-poultice"]')).toHaveAttribute(
    'data-craftable',
    'false'
  );
  await attachEvidence(page, testInfo, 'alchemy-crafted');

  await closeCrafting(page);
  await page.keyboard.press('i');
  await expect(page.locator('[data-item="herbal-poultice"]')).toContainText('Bylinný obklad');
  await expect(page.locator('[data-item="healing-herbs"]')).toHaveCount(0);
  await page.keyboard.press('Escape');

  const save = await readPrimarySave(page);
  expect(save?.version).toBe(5);
  expect(JSON.stringify(save)).toContain('herbal-poultice');

  await page.reload();
  await continueGame(page);
  await page.keyboard.press('i');
  await expect(page.locator('[data-item="herbal-poultice"]')).toContainText('×1');
  await attachEvidence(page, testInfo, 'alchemy-reloaded');
});

test('Bohdanova kovárna nahradí vybavený meč a uloží nový výrobek', async ({ page }, testInfo) => {
  await installCraftingSave(page, {
    player: { x: 355, y: 330 },
    dayClock: 40,
    items: [
      { itemId: 'bohdan-sword', quantity: 1 },
      { itemId: 'iron-ingot', quantity: 1 }
    ]
  });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-near-npc', 'smith-bohdan');
  await expect(body).toHaveAttribute('data-crafting-available', 'forge');
  await openCrafting(page, testInfo);
  await expect(body).toHaveAttribute('data-crafting-station', 'forge');
  await expect(page.locator('[data-recipe="temper-sword"]')).toHaveAttribute(
    'data-craftable',
    'true'
  );

  await page.locator('[data-recipe="temper-sword"] [data-crafting-action="craft"]').click();
  await expect(body).toHaveAttribute('data-last-craft', 'temper-sword');
  await expect(body).toHaveAttribute('data-equipped-weapon', '');
  await expect(body).toHaveAttribute('data-last-save', 'ok');
  await attachEvidence(page, testInfo, 'forge-crafted');
  await closeCrafting(page);

  await page.keyboard.press('i');
  await expect(page.locator('[data-item="bohdan-sword"]')).toHaveCount(0);
  await expect(page.locator('[data-item="tempered-sword"]')).toContainText('Kalený Bohdanův meč');
  await page.locator('[data-item="tempered-sword"] [data-economy-action="equip"]').click();
  await expect(body).toHaveAttribute('data-equipped-weapon', 'tempered-sword');
  await expect(page.locator('#economy-summary')).toContainText('Útok +8');

  const save = await readPrimarySave(page);
  expect(JSON.stringify(save)).toContain('tempered-sword');
  expect(JSON.stringify(save)).not.toContain('bohdan-sword');
});

test('mimo řemeslníky zůstane panel zavřený a zveřejní vysvětlení', async ({ page }, testInfo) => {
  await installCraftingSave(page, {
    player: { x: 240, y: 390 },
    dayClock: 40,
    items: [{ itemId: 'bohdan-sword', quantity: 1 }]
  });
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-crafting-available', '');
  if (isMobileProject(testInfo.project.name)) {
    await page.locator('[data-control="crafting"]').dispatchEvent('pointerdown', {
      pointerId: 5,
      pointerType: 'touch',
      isPrimary: true,
      buttons: 1
    });
  } else {
    await page.keyboard.press('c');
  }
  await expect(page.locator('#crafting-overlay')).toBeHidden();
  await expect(body).toHaveAttribute(
    'data-crafting-message',
    'Řemeslo je dostupné pouze u Anežky nebo Bohdana.'
  );
  await attachEvidence(page, testInfo, 'crafting-unavailable');
});
