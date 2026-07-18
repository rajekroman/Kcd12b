export type ReputationFaction = 'peasants' | 'townsfolk' | 'nobility';
export type ReputationTier = 'hostile' | 'distrusted' | 'neutral' | 'respected' | 'honored';

export interface ReputationState {
  peasants: number;
  townsfolk: number;
  nobility: number;
}

export interface ReputationChange {
  faction: ReputationFaction;
  amount: number;
  reason: string;
}

export interface TradeReputationContext {
  factionReputation: number;
  charisma: number;
}

export interface ReputationTradeModifiers {
  buyMultiplier: number;
  sellMultiplier: number;
}

export const MIN_REPUTATION = -100;
export const MAX_REPUTATION = 100;

export const createInitialReputationState = (): ReputationState => ({
  peasants: 0,
  townsfolk: 0,
  nobility: 0
});

export const clampReputation = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, Math.round(value)));
};

export const adjustReputation = (
  state: ReputationState,
  change: ReputationChange
): ReputationState => ({
  ...state,
  [change.faction]: clampReputation(state[change.faction] + change.amount)
});

export const applyReputationChanges = (
  state: ReputationState,
  changes: readonly ReputationChange[]
): ReputationState => changes.reduce(adjustReputation, state);

export const getReputationTier = (value: number): ReputationTier => {
  const normalized = clampReputation(value);
  if (normalized <= -60) return 'hostile';
  if (normalized <= -20) return 'distrusted';
  if (normalized < 20) return 'neutral';
  if (normalized < 60) return 'respected';
  return 'honored';
};

export const getReputationTierLabel = (tier: ReputationTier): string => {
  const labels: Record<ReputationTier, string> = {
    hostile: 'nepřátelská',
    distrusted: 'nedůvěřivá',
    neutral: 'neutrální',
    respected: 'vážená',
    honored: 'ctěná'
  };
  return labels[tier];
};

export const getFactionLabel = (faction: ReputationFaction): string => {
  const labels: Record<ReputationFaction, string> = {
    peasants: 'Sedláci',
    townsfolk: 'Měšťané',
    nobility: 'Šlechta'
  };
  return labels[faction];
};

export const getTradeReputationModifiers = ({
  factionReputation,
  charisma
}: TradeReputationContext): ReputationTradeModifiers => {
  const reputation = clampReputation(factionReputation);
  const normalizedCharisma = Number.isFinite(charisma) ? Math.max(0, Math.min(20, charisma)) : 0;
  const socialScore = reputation / 100 + normalizedCharisma / 40;

  return {
    buyMultiplier: Math.max(0.7, Math.min(1.35, 1 - socialScore * 0.18)),
    sellMultiplier: Math.max(0.65, Math.min(1.3, 1 + socialScore * 0.16))
  };
};

export const calculateReputationPrice = (
  basePrice: number,
  direction: 'buy' | 'sell',
  context: TradeReputationContext
): number => {
  if (!Number.isFinite(basePrice) || basePrice < 0) return 0;
  const modifiers = getTradeReputationModifiers(context);
  const multiplier = direction === 'buy' ? modifiers.buyMultiplier : modifiers.sellMultiplier;
  return Math.max(1, Math.round(basePrice * multiplier));
};

export const getReputationAverage = (state: ReputationState): number =>
  Math.round((state.peasants + state.townsfolk + state.nobility) / 3);
