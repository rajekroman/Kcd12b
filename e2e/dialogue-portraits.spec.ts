import { expect, test, type Page } from '@playwright/test';

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

const installSave = async (
  page: Page,
  player: { x: number; y: number },
  townsfolk: number
): Promise<void> => {
  await page.addInitScript(
    ({ position, reputation, economy }) => {
      localStorage.setItem(
        'chronicles-of-bohemia.save.v4',
        JSON.stringify({
          version: 4,
          player: { ...position, health: 100, stamina: 100 },
          quest: { id: 'first-steel', step: 'meet-smith', banditDefeated: false },
          world: { dayClock: 45 },
          economy,
          reputation: { peasants: 0, townsfolk: reputation, nobility: 0 },
          savedAt: '2026-07-18T08:00:00.000Z'
        })
      );
    },
    { position: player, reputation: townsfolk, economy: initialEconomy }
  );
};

const continueGame = async (page: Page): Promise<void> => {
  await page.goto('/Kcd12b/');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-menu-ready', 'true');
  await expect(body).toHaveAttribute('data-has-save', 'true');
  await expect(body).toHaveAttribute('data-portrait-atlases', '10');
  await expect(body).toHaveAttribute('data-portrait-expressions', '6');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Canvas bounds are not available.');
  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.77);

  await expect(body).toHaveAttribute('data-scene', 'game');
  await expect(body).toHaveAttribute('data-save-ready', 'true');
};

test('Bohdan při zadání úkolu zobrazí vlastní přísný portrét', async ({ page }) => {
  await installSave(page, { x: 370, y: 340 }, 0);
  await continueGame(page);
  const body = page.locator('body');

  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue-id', 'bohdan-offer-first-steel');
  await expect(body).toHaveAttribute('data-dialogue-portrait', 'smith-bohdan');
  await expect(body).toHaveAttribute('data-dialogue-expression', 'stern');
  await expect(page.locator('#game-status')).toContainText('výraz přísný');
});

test('vysoká pověst zobrazí Kateřinin hrdý portrét', async ({ page }) => {
  await installSave(page, { x: 480, y: 395 }, 60);
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-near-npc', 'trader-katerina');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue-id', 'katerina-honored');
  await expect(body).toHaveAttribute('data-dialogue-portrait', 'trader-katerina');
  await expect(body).toHaveAttribute('data-dialogue-expression', 'proud');
});

test('nízká pověst zobrazí Kateřinin nedůvěřivý portrét', async ({ page }) => {
  await installSave(page, { x: 480, y: 395 }, -20);
  await continueGame(page);
  const body = page.locator('body');

  await expect(body).toHaveAttribute('data-near-npc', 'trader-katerina');
  await page.keyboard.press('e');
  await expect(body).toHaveAttribute('data-dialogue-id', 'katerina-distrusted');
  await expect(body).toHaveAttribute('data-dialogue-portrait', 'trader-katerina');
  await expect(body).toHaveAttribute('data-dialogue-expression', 'suspicious');
});
