export type DamageType = 'slash' | 'pierce' | 'blunt';
export type ArmorType = 'cloth' | 'mail' | 'plate';
export type AttackDirection = 'high' | 'left' | 'right' | 'low-left' | 'low-right';
export type AttackOutcome = 'hit' | 'guarded' | 'opening';
export type DefenseOutcome = 'hit' | 'blocked' | 'partial-block' | 'perfect-block' | 'guard-break';

export const ATTACK_DIRECTIONS: readonly AttackDirection[] = [
  'high',
  'left',
  'right',
  'low-left',
  'low-right'
];

const armorResistance: Record<ArmorType, Record<DamageType, number>> = {
  cloth: { slash: 0.1, pierce: 0.05, blunt: 0.05 },
  mail: { slash: 0.45, pierce: 0.25, blunt: 0.15 },
  plate: { slash: 0.7, pierce: 0.45, blunt: 0.25 }
};

const attackStaminaCost: Record<AttackDirection, number> = {
  high: 20,
  left: 15,
  right: 15,
  'low-left': 17,
  'low-right': 17
};

const openingGuards: Record<AttackDirection, readonly AttackDirection[]> = {
  high: ['low-left', 'low-right'],
  left: ['right', 'low-right'],
  right: ['left', 'low-left'],
  'low-left': ['high', 'right'],
  'low-right': ['high', 'left']
};

export interface DamageInput {
  baseDamage: number;
  staminaRatio: number;
  type: DamageType;
  armor: ArmorType;
  critical?: boolean;
}

export interface DirectionalAttackInput extends DamageInput {
  attackDirection: AttackDirection;
  guardDirection?: AttackDirection;
}

export interface DirectionalAttackResolution {
  damage: number;
  outcome: AttackOutcome;
  staminaCost: number;
  multiplier: number;
}

export interface DefenseInput {
  incomingDamage: number;
  incomingDirection: AttackDirection;
  guardDirection: AttackDirection;
  blocking: boolean;
  blockStartedAt: number;
  hitAt: number;
  stamina: number;
  perfectWindowMs?: number;
}

export interface DefenseResolution {
  damage: number;
  staminaCost: number;
  outcome: DefenseOutcome;
  staggerMs: number;
}

export const calculateDamage = ({
  baseDamage,
  staminaRatio,
  type,
  armor,
  critical = false
}: DamageInput): number => {
  const staminaMultiplier = 0.55 + Math.max(0, Math.min(1, staminaRatio)) * 0.45;
  const criticalMultiplier = critical ? 1.5 : 1;
  const resisted = 1 - armorResistance[armor][type];
  return Math.max(1, Math.round(baseDamage * staminaMultiplier * criticalMultiplier * resisted));
};

export const resolveDirectionalAttack = ({
  attackDirection,
  guardDirection,
  ...damageInput
}: DirectionalAttackInput): DirectionalAttackResolution => {
  const baseDamage = calculateDamage(damageInput);
  let multiplier = 1;
  let outcome: AttackOutcome = 'hit';

  if (guardDirection === attackDirection) {
    multiplier = 0.3;
    outcome = 'guarded';
  } else if (guardDirection && openingGuards[attackDirection].includes(guardDirection)) {
    multiplier = 1.25;
    outcome = 'opening';
  }

  return {
    damage: Math.max(1, Math.round(baseDamage * multiplier)),
    outcome,
    staminaCost: attackStaminaCost[attackDirection],
    multiplier
  };
};

export const resolveDefense = ({
  incomingDamage,
  incomingDirection,
  guardDirection,
  blocking,
  blockStartedAt,
  hitAt,
  stamina,
  perfectWindowMs = 220
}: DefenseInput): DefenseResolution => {
  if (!blocking) {
    return { damage: incomingDamage, staminaCost: 0, outcome: 'hit', staggerMs: 0 };
  }

  const guardMatches = incomingDirection === guardDirection;
  const elapsed = Math.max(0, hitAt - blockStartedAt);
  const requiredStamina = guardMatches ? 12 : 16;

  if (stamina < requiredStamina) {
    return {
      damage: Math.max(1, Math.round(incomingDamage * 1.1)),
      staminaCost: stamina,
      outcome: 'guard-break',
      staggerMs: 0
    };
  }

  if (guardMatches && elapsed <= perfectWindowMs) {
    return {
      damage: 0,
      staminaCost: 8,
      outcome: 'perfect-block',
      staggerMs: 650
    };
  }

  if (guardMatches) {
    return {
      damage: Math.max(1, Math.round(incomingDamage * 0.25)),
      staminaCost: requiredStamina,
      outcome: 'blocked',
      staggerMs: 180
    };
  }

  return {
    damage: Math.max(1, Math.round(incomingDamage * 0.65)),
    staminaCost: requiredStamina,
    outcome: 'partial-block',
    staggerMs: 0
  };
};

export const getAttackDirectionFromVector = (
  x: number,
  y: number,
  fallback: AttackDirection = 'high'
): AttackDirection => {
  const length = Math.hypot(x, y);
  if (length < 0.15) return fallback;

  const normalizedX = x / length;
  const normalizedY = y / length;

  if (normalizedY < -0.55 && Math.abs(normalizedX) < 0.65) return 'high';
  if (normalizedY > 0.35) return normalizedX < 0 ? 'low-left' : 'low-right';
  return normalizedX < 0 ? 'left' : 'right';
};

export const getAttackDirectionLabel = (direction: AttackDirection): string => {
  const labels: Record<AttackDirection, string> = {
    high: 'horní',
    left: 'levý',
    right: 'pravý',
    'low-left': 'spodní levý',
    'low-right': 'spodní pravý'
  };
  return labels[direction];
};
