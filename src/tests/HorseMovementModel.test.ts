import { describe, expect, it } from "vitest";

import {
  createInitialHorseMovementState,
  stepHorseMovement,
  type HorseCollisionProbe,
} from "../gameplay/HorseMovementModel";

const openWorld: HorseCollisionProbe = { canOccupy: () => true };

describe("HorseMovementModel", () => {
  it("moves diagonally without exceeding configured speed", () => {
    const next = stepHorseMovement(
      createInitialHorseMovementState(),
      { axisX: 1, axisY: 1, sprint: false },
      1,
      openWorld,
    );

    expect(Math.hypot(next.x, next.y)).toBeCloseTo(70, 5);
    expect(next.gait).toBe("walk");
  });

  it("drains stamina while sprinting and falls back to canter at zero", () => {
    const sprinted = stepHorseMovement(
      { ...createInitialHorseMovementState(), stamina: 10 },
      { axisX: 1, axisY: 0, sprint: true },
      1,
      openWorld,
    );
    expect(sprinted.stamina).toBe(0);
    expect(sprinted.gait).toBe("sprint");

    const exhausted = stepHorseMovement(
      sprinted,
      { axisX: 1, axisY: 0, sprint: true },
      1,
      openWorld,
    );
    expect(exhausted.gait).toBe("canter");
  });

  it("recovers stamina while idle", () => {
    const next = stepHorseMovement(
      { ...createInitialHorseMovementState(), stamina: 20 },
      { axisX: 0, axisY: 0, sprint: false },
      2,
      openWorld,
    );

    expect(next.stamina).toBe(56);
    expect(next.gait).toBe("idle");
  });

  it("keeps position when collision probe rejects the destination", () => {
    const blocked: HorseCollisionProbe = { canOccupy: () => false };
    const initial = createInitialHorseMovementState(10, 20);
    const next = stepHorseMovement(
      initial,
      { axisX: 1, axisY: 0, sprint: false },
      1,
      blocked,
    );

    expect(next.x).toBe(10);
    expect(next.y).toBe(20);
    expect(next.gait).toBe("idle");
  });

  it("clamps negative delta time to zero", () => {
    const initial = createInitialHorseMovementState(10, 20);
    expect(
      stepHorseMovement(initial, { axisX: 1, axisY: 0, sprint: true }, -1, openWorld),
    ).toEqual(initial);
  });
});
