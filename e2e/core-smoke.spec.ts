import { expect, test } from '@playwright/test';
import {
  attachEvidence,
  closeInventory,
  movePlayer,
  openInventory,
  startNewGame
} from './support/game';

test.describe('core game smoke', () => {
  test('menu → game → movement → inventory → game', async ({ page }, testInfo) => {
    await startNewGame(page);
    await movePlayer(page, testInfo.project.name);

    await openInventory(page, testInfo.project.name);
    await attachEvidence(page, testInfo, `${testInfo.project.name}-inventory`);
    await closeInventory(page);

    await expect(page.locator('#app canvas')).toBeVisible();
    await attachEvidence(page, testInfo, `${testInfo.project.name}-game`);
  });

  test('mobile controls respect viewport and do not create scroll or zoom conflicts', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('iphone-'), 'Mobilní geometrie se ověřuje pouze v iPhone projektech.');
    await startNewGame(page);

    const layout = await page.evaluate(() => {
      const controls = document.querySelector<HTMLElement>('#mobile-controls');
      const dpad = document.querySelector<HTMLElement>('.dpad');
      const actions = document.querySelector<HTMLElement>('.actions');
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('#mobile-controls button'));
      if (!controls || !dpad || !actions || buttons.length === 0) {
        throw new Error('Mobilní ovládací prvky nebyly nalezeny.');
      }

      const controlsRect = controls.getBoundingClientRect();
      const dpadRect = dpad.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const overlaps = !(
        dpadRect.right <= actionsRect.left ||
        actionsRect.right <= dpadRect.left ||
        dpadRect.bottom <= actionsRect.top ||
        actionsRect.bottom <= dpadRect.top
      );

      return {
        controls: {
          left: controlsRect.left,
          top: controlsRect.top,
          right: controlsRect.right,
          bottom: controlsRect.bottom
        },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scroll: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        overlaps,
        buttonTouchActions: buttons.map((button) => getComputedStyle(button).touchAction),
        userScalableDisabled: document
          .querySelector('meta[name="viewport"]')
          ?.getAttribute('content')
          ?.includes('user-scalable=no') ?? false
      };
    });

    expect(layout.controls.left).toBeGreaterThanOrEqual(0);
    expect(layout.controls.top).toBeGreaterThanOrEqual(0);
    expect(layout.controls.right).toBeLessThanOrEqual(layout.viewport.width);
    expect(layout.controls.bottom).toBeLessThanOrEqual(layout.viewport.height);
    expect(layout.scroll.width).toBeLessThanOrEqual(layout.viewport.width);
    expect(layout.scroll.height).toBeLessThanOrEqual(layout.viewport.height);
    expect(layout.overlaps).toBe(false);
    expect(layout.buttonTouchActions.every((value) => ['none', 'manipulation'].includes(value))).toBe(true);
    expect(layout.userScalableDisabled).toBe(false);

    await attachEvidence(page, testInfo, `${testInfo.project.name}-safe-area`);
  });
});
