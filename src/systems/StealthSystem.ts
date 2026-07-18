export type AwarenessLevel = 'unaware' | 'suspicious' | 'alerted';

export interface WorldVector {
  x: number;
  y: number;
}

export interface VisionCone {
  origin: WorldVector;
  direction: WorldVector;
  range: number;
  halfAngleDegrees: number;
}

export interface VisionSample {
  visible: boolean;
  distance: number;
  distanceRatio: number;
  angleDegrees: number;
}

export interface SuspicionState {
  value: number;
  level: AwarenessLevel;
  lastSeenAt: number | null;
}

export interface SuspicionConfig {
  maximum: number;
  suspiciousThreshold: number;
  alertedThreshold: number;
  gainPerSecond: number;
  decayPerSecond: number;
  closeRangeMultiplier: number;
}

export interface SuspicionUpdateInput {
  state: SuspicionState;
  sample: VisionSample;
  deltaMs: number;
  now: number;
  config?: Partial<SuspicionConfig>;
}

export const DEFAULT_SUSPICION_CONFIG: SuspicionConfig = {
  maximum: 100,
  suspiciousThreshold: 30,
  alertedThreshold: 100,
  gainPerSecond: 42,
  decayPerSecond: 18,
  closeRangeMultiplier: 1.2
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const vectorLength = (vector: WorldVector): number => Math.hypot(vector.x, vector.y);

export const normalizeVector = (
  vector: WorldVector,
  fallback: WorldVector = { x: 1, y: 0 }
): WorldVector => {
  const length = vectorLength(vector);
  if (!Number.isFinite(length) || length <= Number.EPSILON) return { ...fallback };
  return { x: vector.x / length, y: vector.y / length };
};

export const getAwarenessLevel = (
  value: number,
  config: SuspicionConfig = DEFAULT_SUSPICION_CONFIG
): AwarenessLevel => {
  const normalized = clamp(Number.isFinite(value) ? value : 0, 0, config.maximum);
  if (normalized >= config.alertedThreshold) return 'alerted';
  if (normalized >= config.suspiciousThreshold) return 'suspicious';
  return 'unaware';
};

export const sampleVisionCone = (cone: VisionCone, target: WorldVector): VisionSample => {
  const offset = {
    x: target.x - cone.origin.x,
    y: target.y - cone.origin.y
  };
  const distance = vectorLength(offset);
  const validRange = Number.isFinite(cone.range) ? Math.max(0, cone.range) : 0;
  const halfAngle = Number.isFinite(cone.halfAngleDegrees)
    ? clamp(cone.halfAngleDegrees, 0, 180)
    : 0;

  if (distance <= Number.EPSILON) {
    return { visible: true, distance: 0, distanceRatio: 0, angleDegrees: 0 };
  }

  const direction = normalizeVector(cone.direction);
  const targetDirection = normalizeVector(offset);
  const dot = clamp(
    direction.x * targetDirection.x + direction.y * targetDirection.y,
    -1,
    1
  );
  const angleDegrees = (Math.acos(dot) * 180) / Math.PI;
  const distanceRatio = validRange > 0 ? distance / validRange : Number.POSITIVE_INFINITY;

  return {
    visible: distance <= validRange && angleDegrees <= halfAngle,
    distance,
    distanceRatio,
    angleDegrees
  };
};

export const createInitialSuspicionState = (): SuspicionState => ({
  value: 0,
  level: 'unaware',
  lastSeenAt: null
});

export const updateSuspicion = ({
  state,
  sample,
  deltaMs,
  now,
  config: overrides
}: SuspicionUpdateInput): SuspicionState => {
  const config = { ...DEFAULT_SUSPICION_CONFIG, ...overrides };
  const seconds = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0) / 1000;
  const current = clamp(Number.isFinite(state.value) ? state.value : 0, 0, config.maximum);
  let nextValue = current;
  let lastSeenAt = state.lastSeenAt;

  if (sample.visible) {
    const proximity = 1 - clamp(sample.distanceRatio, 0, 1);
    const multiplier = 1 + proximity * config.closeRangeMultiplier;
    nextValue += config.gainPerSecond * multiplier * seconds;
    lastSeenAt = Number.isFinite(now) ? now : lastSeenAt;
  } else {
    nextValue -= config.decayPerSecond * seconds;
  }

  nextValue = clamp(nextValue, 0, config.maximum);
  return {
    value: nextValue,
    level: getAwarenessLevel(nextValue, config),
    lastSeenAt
  };
};

export const getSuspicionLabel = (level: AwarenessLevel): string => {
  const labels: Record<AwarenessLevel, string> = {
    unaware: 'Klid',
    suspicious: 'Podezření',
    alerted: 'Poplach'
  };
  return labels[level];
};
