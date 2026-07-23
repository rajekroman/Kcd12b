import { describe, expect, it } from 'vitest';
import { shouldResumeGameplayInput } from '../game/CraftingUiController';

describe('CraftingUiController input ownership', () => {
  it('obnoví gameplay pouze ve hře bez jiného aktivního modalu', () => {
    expect(shouldResumeGameplayInput({
      scene: 'game',
      economyOpen: false,
      blockingModalVisible: false
    })).toBe(true);
  });

  it('neobnoví gameplay, pokud inventář nebo obchod stále vlastní modal', () => {
    expect(shouldResumeGameplayInput({
      scene: 'game',
      economyOpen: true,
      blockingModalVisible: true
    })).toBe(false);
  });

  it('neobnoví gameplay při jiném viditelném dialogu ani mimo GameScene', () => {
    expect(shouldResumeGameplayInput({
      scene: 'game',
      economyOpen: false,
      blockingModalVisible: true
    })).toBe(false);
    expect(shouldResumeGameplayInput({
      scene: 'menu',
      economyOpen: false,
      blockingModalVisible: false
    })).toBe(false);
  });
});
