export type DamageType = 'slash' | 'pierce' | 'blunt';
export type ArmorType = 'cloth' | 'mail' | 'plate';

const armorResistance: Record<ArmorType, Record<DamageType, number>> = {
  cloth: { slash: 0.1, pierce: 0.05, blunt: 0.05 },
  mail: { slash: 0.45, pierce: 0.25, blunt: 0.15 },
  plate: { slash: 0.7, pierce: 0.45, blunt: 0.25 }
};

export interface DamageInput {
  baseDamage: number;
  staminaRatio: number;
  type: DamageType;
  armor: ArmorType;
  critical?: boolean;
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
