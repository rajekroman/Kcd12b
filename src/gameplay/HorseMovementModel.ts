export type HorseGait = "idle" | "walk" | "canter" | "sprint";

export interface HorseMovementConfig {
  readonly walkSpeed: number;
  readonly canterSpeed: number;
  readonly sprintSpeed: number;
  readonly maxStamina: number;
  readonly sprintDrainPerSecond: number;
  readonly recoveryPerSecond: number;
}

export interface HorseMovementState {
  readonly x: number;
  readonly y: number;
  readonly stamina: number;
  readonly gait: HorseGait;
}

export interface HorseMovementInput {
  readonly axisX: number;
  readonly axisY: number;
  readonly sprint: boolean;
}

export interface HorseCollisionProbe {
  canOccupy(x: number, y: number): boolean;
}

export const DEFAULT_HORSE_MOVEMENT_CONFIG: HorseMovementConfig = {
  walkSpeed: 70,
  canterSpeed: 115,
  sprintSpeed: 165,
  maxStamina: 100,
  sprintDrainPerSecond: 28,
  recoveryPerSecond: 18,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeAxis = (x: number, y: number): readonly [number, number] => {
  const length = Math.hypot(x, y);
  if (length === 0) return [0, 0];
  if (length <= 1) return [x, y];
  return [x / length, y / length];
};

export const createInitialHorseMovementState = (
  x = 0,
  y = 0,
  config: HorseMovementConfig = DEFAULT_HORSE_MOVEMENT_CONFIG,
): HorseMovementState => ({ x, y, stamina: config.maxStamina, gait: "idle" });

export const stepHorseMovement = (
  state: HorseMovementState,
  input: HorseMovementInput,
  deltaSeconds: number,
  collision: HorseCollisionProbe,
  config: HorseMovementConfig = DEFAULT_HORSE_MOVEMENT_CONFIG,
): HorseMovementState => {
  const dt = Math.max(0, deltaSeconds);
  const [axisX, axisY] = normalizeAxis(input.axisX, input.axisY);
  const moving = axisX !== 0 || axisY !== 0;
  const sprinting = moving && input.sprint && state.stamina > 0;
  const gait: HorseGait = !moving ? "idle" : sprinting ? "sprint" : input.sprint ? "canter" : "walk";
  const speed = gait === "sprint" ? config.sprintSpeed : gait === "canter" ? config.canterSpeed : gait === "walk" ? config.walkSpeed : 0;
  const nextStamina = sprinting
    ? clamp(state.stamina - config.sprintDrainPerSecond * dt, 0, config.maxStamina)
    : clamp(state.stamina + config.recoveryPerSecond * dt, 0, config.maxStamina);
  const nextX = state.x + axisX * speed * dt;
  const nextY = state.y + axisY * speed * dt;

  if (!moving || collision.canOccupy(nextX, nextY)) {
    return { x: nextX, y: nextY, stamina: nextStamina, gait };
  }

  return { ...state, stamina: nextStamina, gait: "idle" };
};
