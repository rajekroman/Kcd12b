import { describe, expect, it } from 'vitest';
import {
  calculateDamage,
  getAttackDirectionFromVector,
  isWithinMeleeImpactRange,
  resolveDefense,
  resolveDirectionalAttack
} from '../systems/CombatSystem';

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

describe('resolveDirectionalAttack', () => {
  const attack = {
    baseDamage: 24,
    staminaRatio: 1,
    type: 'slash' as const,
    armor: 'cloth' as const,
    attackDirection: 'left' as const
  };

  it('ztlumí zásah při shodném směru krytu', () => {
    const guarded = resolveDirectionalAttack({ ...attack, guardDirection: 'left' });
    const open = resolveDirectionalAttack({ ...attack, guardDirection: 'right' });

    expect(guarded.outcome).toBe('guarded');
    expect(open.outcome).toBe('opening');
    expect(open.damage).toBeGreaterThan(guarded.damage);
  });

  it('má rozdílnou spotřebu výdrže podle směru', () => {
    const high = resolveDirectionalAttack({ ...attack, attackDirection: 'high' });
    const right = resolveDirectionalAttack({ ...attack, attackDirection: 'right' });

    expect(high.staminaCost).toBeGreaterThan(right.staminaCost);
  });
});

describe('resolveDefense', () => {
  it('dokonalý kryt neguje poškození a omráčí útočníka', () => {
    const result = resolveDefense({
      incomingDamage: 18,
      incomingDirection: 'high',
      guardDirection: 'high',
      blocking: true,
      blockStartedAt: 1000,
      hitAt: 1160,
      stamina: 100
    });

    expect(result.outcome).toBe('perfect-block');
    expect(result.damage).toBe(0);
    expect(result.staggerMs).toBeGreaterThan(0);
  });

  it('špatný směr krytu propustí část poškození', () => {
    const result = resolveDefense({
      incomingDamage: 20,
      incomingDirection: 'left',
      guardDirection: 'right',
      blocking: true,
      blockStartedAt: 1000,
      hitAt: 1400,
      stamina: 100
    });

    expect(result.outcome).toBe('partial-block');
    expect(result.damage).toBeGreaterThan(0);
    expect(result.damage).toBeLessThan(20);
  });

  it('prolomí kryt bez potřebné výdrže', () => {
    const result = resolveDefense({
      incomingDamage: 20,
      incomingDirection: 'right',
      guardDirection: 'right',
      blocking: true,
      blockStartedAt: 1000,
      hitAt: 1400,
      stamina: 5
    });

    expect(result.outcome).toBe('guard-break');
    expect(result.damage).toBeGreaterThan(20);
  });
});

describe('isWithinMeleeImpactRange', () => {
  it('povolí zásah na hranici dosahu a odmítne vzdálený cíl', () => {
    expect(isWithinMeleeImpactRange(46)).toBe(true);
    expect(isWithinMeleeImpactRange(46.01)).toBe(false);
    expect(isWithinMeleeImpactRange(60, 64)).toBe(true);
  });

  it('odmítne neplatné vzdálenosti', () => {
    expect(isWithinMeleeImpactRange(-1)).toBe(false);
    expect(isWithinMeleeImpactRange(Number.NaN)).toBe(false);
    expect(isWithinMeleeImpactRange(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('getAttackDirectionFromVector', () => {
  it('převádí pohyb a gesto na jeden z pěti směrů', () => {
    expect(getAttackDirectionFromVector(0, -1)).toBe('high');
    expect(getAttackDirectionFromVector(-1, 0)).toBe('left');
    expect(getAttackDirectionFromVector(1, 0)).toBe('right');
    expect(getAttackDirectionFromVector(-1, 1)).toBe('low-left');
    expect(getAttackDirectionFromVector(1, 1)).toBe('low-right');
  });
});
