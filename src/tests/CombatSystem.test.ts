import { describe, expect, it } from 'vitest';
import { calculateDamage } from '../systems/CombatSystem';

describe('calculateDamage', () => {
  it('respektuje typ zbroje a minimální poškození', () => {
    const cloth = calculateDamage({
      baseDamage: 20,
      staminaRatio: 1,
      type: 'slash',
      armor: 'cloth'
    });
    const plate = calculateDamage({
      baseDamage: 20,
      staminaRatio: 1,
      type: 'slash',
      armor: 'plate'
    });
    expect(cloth).toBeGreaterThan(plate);
    expect(plate).toBeGreaterThanOrEqual(1);
  });

  it('zvyšuje kritický zásah', () => {
    const normal = calculateDamage({
      baseDamage: 20,
      staminaRatio: 1,
      type: 'blunt',
      armor: 'mail'
    });
    const critical = calculateDamage({
      baseDamage: 20,
      staminaRatio: 1,
      type: 'blunt',
      armor: 'mail',
      critical: true
    });
    expect(critical).toBeGreaterThan(normal);
  });
});
