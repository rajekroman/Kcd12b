import { describe, expect, it } from 'vitest';
import type { HorseRuntimeStateSnapshot } from '../contracts/horseRuntime';
import { HorseSceneMovementAdapter } from '../game/controllers/HorseSceneMovementAdapter';
import type { HorseGameplayRuntime } from '../gameplay/HorseGameplayRuntime';
import type { HorseMovementState } from '../gameplay/HorseMovementModel';

const snapshot = (mountedActorId: string | null): HorseRuntimeStateSnapshot => ({
  questId: 'quest.first-horse',
  horseId: 'horse.jiskra',
  worldFlags: {},
  counters: {},
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  mountedActorId,
  failed: false,
  completed: false
});

const runtime = (getMountedActorId: () => string | null): HorseGameplayRuntime => ({
  getSnapshot: () => snapshot(getMountedActorId())
}) as HorseGameplayRuntime;

describe('HorseSceneMovementAdapter', () => {
  it('applies movement only for the authoritative mounted actor', () => {
    let mountedActorId: string | null = 'player.henry';
    let position = { x: 10, y: 20 };
    let reported: HorseMovementState | null = null;
    const adapter = new HorseSceneMovementAdapter({
      runtime: runtime(() => mountedActorId),
      actorId: 'player.henry',
      host: {
        getPosition: () => position,
        setPosition: (x, y) => { position = { x, y }; },
        setMovementState: (state) => { reported = state; }
      },
      collision: { canOccupy: () => true }
    });

    const moved = adapter.step({ axisX: 1, axisY: 0, sprint: false }, 1);
    expect(moved.x).toBe(80);
    expect(position.x).toBe(80);
    expect(reported?.gait).toBe('walk');

    mountedActorId = null;
    const blocked = adapter.step({ axisX: 1, axisY: 0, sprint: true }, 1);
    expect(blocked.x).toBe(80);
    expect(blocked.gait).toBe('idle');
    expect(position.x).toBe(80);
  });

  it('rejects movement from a different mounted actor', () => {
    let position = { x: 4, y: 8 };
    const adapter = new HorseSceneMovementAdapter({
      runtime: runtime(() => 'npc.robber'),
      actorId: 'player.henry',
      host: {
        getPosition: () => position,
        setPosition: (x, y) => { position = { x, y }; },
        setMovementState: () => undefined
      },
      collision: { canOccupy: () => true }
    });

    const next = adapter.step({ axisX: 0, axisY: 1, sprint: false }, 2);
    expect(next).toMatchObject({ x: 4, y: 8, gait: 'idle' });
    expect(position).toEqual({ x: 4, y: 8 });
  });

  it('keeps scene position unchanged when collision rejects destination', () => {
    let position = { x: 0, y: 0 };
    const adapter = new HorseSceneMovementAdapter({
      runtime: runtime(() => 'player.henry'),
      actorId: 'player.henry',
      host: {
        getPosition: () => position,
        setPosition: (x, y) => { position = { x, y }; },
        setMovementState: () => undefined
      },
      collision: { canOccupy: () => false }
    });

    const next = adapter.step({ axisX: 1, axisY: 0, sprint: true }, 1);
    expect(next.x).toBe(0);
    expect(next.gait).toBe('idle');
    expect(position).toEqual({ x: 0, y: 0 });
  });
});
