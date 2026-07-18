import { describe, expect, it } from 'vitest';
import {
  adjustReputation,
  applyReputationChanges,
  calculateReputationPrice,
  clampReputation,
  createInitialReputationState,
  getReputationAverage,
  getReputationTier,
  getTradeReputationModifiers
} from '../systems/ReputationSystem';

describe('ReputationSystem', () => {
  it('vytvoří neutrální stav všech tří skupin', () => {
    const state = createInitialReputationState();

    expect(state).toEqual({ peasants: 0, townsfolk: 0, nobility: 0 });
    expect(getReputationAverage(state)).toBe(0);
  });

  it('upraví pouze zvolenou skupinu a omezí rozsah', () => {
    const initial = createInitialReputationState();
    const respected = adjustReputation(initial, {
      faction: 'peasants',
      amount: 35,
      reason: 'Pomoc vesnici'
    });
    const capped = adjustReputation(respected, {
      faction: 'peasants',
      amount: 500,
      reason: 'Test horní hranice'
    });

    expect(respected).toEqual({ peasants: 35, townsfolk: 0, nobility: 0 });
    expect(capped.peasants).toBe(100);
    expect(initial.peasants).toBe(0);
    expect(clampReputation(-999)).toBe(-100);
  });

  it('aplikuje více změn v pořadí', () => {
    const state = applyReputationChanges(createInitialReputationState(), [
      { faction: 'peasants', amount: 12, reason: 'Quest' },
      { faction: 'townsfolk', amount: 5, reason: 'Quest' },
      { faction: 'peasants', amount: -2, reason: 'Přestupek' }
    ]);

    expect(state).toEqual({ peasants: 10, townsfolk: 5, nobility: 0 });
  });

  it('rozlišuje pět reputačních úrovní na hranicích', () => {
    expect(getReputationTier(-100)).toBe('hostile');
    expect(getReputationTier(-60)).toBe('hostile');
    expect(getReputationTier(-59)).toBe('distrusted');
    expect(getReputationTier(-20)).toBe('distrusted');
    expect(getReputationTier(-19)).toBe('neutral');
    expect(getReputationTier(19)).toBe('neutral');
    expect(getReputationTier(20)).toBe('respected');
    expect(getReputationTier(59)).toBe('respected');
    expect(getReputationTier(60)).toBe('honored');
  });

  it('dobrá pověst a charisma zlevní nákup a zvýší výkup', () => {
    const neutral = getTradeReputationModifiers({ factionReputation: 0, charisma: 0 });
    const trusted = getTradeReputationModifiers({ factionReputation: 60, charisma: 4 });

    expect(neutral).toEqual({ buyMultiplier: 1, sellMultiplier: 1 });
    expect(trusted.buyMultiplier).toBeLessThan(1);
    expect(trusted.sellMultiplier).toBeGreaterThan(1);
    expect(calculateReputationPrice(100, 'buy', { factionReputation: 60, charisma: 4 })).toBeLessThan(100);
    expect(calculateReputationPrice(100, 'sell', { factionReputation: 60, charisma: 4 })).toBeGreaterThan(100);
  });

  it('nepřátelská pověst zdraží nákup a sníží výkup', () => {
    expect(
      calculateReputationPrice(100, 'buy', { factionReputation: -80, charisma: 0 })
    ).toBeGreaterThan(100);
    expect(
      calculateReputationPrice(100, 'sell', { factionReputation: -80, charisma: 0 })
    ).toBeLessThan(100);
  });
});
