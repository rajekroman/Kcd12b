import { describe, expect, it } from 'vitest';
import type { HorseRuntimeStateSnapshot } from '../contracts/horseRuntime';
import { createHorseHudViewModel } from '../game/ui/HorseHudViewModel';

const snapshot = (overrides: Partial<HorseRuntimeStateSnapshot> = {}): HorseRuntimeStateSnapshot => ({
  questId: 'quest.first_horse.oak_and_reins',
  horseId: 'horse.dun_mare_jiskra',
  worldFlags: {},
  counters: {},
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  mountedActorId: null,
  failed: false,
  completed: false,
  ...overrides,
});

describe('createHorseHudViewModel', () => {
  it('maps authoritative trust and mount unlock state without mutating the snapshot', () => {
    const source = snapshot({
      worldFlags: {
        'horse.jiskra.claimed': true,
        'horse.jiskra.mount_unlocked': true,
      },
      counters: { 'horse.jiskra.trust_points': 3 },
      selectedSolution: 'lawful_service',
    });
    const before = JSON.stringify(source);

    const viewModel = createHorseHudViewModel({ snapshot: source, actorId: 'player.henry' });

    expect(viewModel.trust).toEqual({ current: 3, target: 3, label: 'Důvěra 3/3' });
    expect(viewModel.claimed).toBe(true);
    expect(viewModel.mountUnlocked).toBe(true);
    expect(viewModel.mounted).toBe(false);
    expect(viewModel.solution).toBe('lawful_service');
    expect(JSON.stringify(source)).toBe(before);
  });

  it('shows mounted gait, stamina and trial checkpoint progress from runtime inputs', () => {
    const viewModel = createHorseHudViewModel({
      snapshot: snapshot({
        worldFlags: {
          'horse.jiskra.claimed': true,
          'horse.jiskra.mount_unlocked': true,
          'horse.jiskra.trial_started': true,
        },
        counters: { 'horse.jiskra.trial_checkpoint_index': 2 },
        mountedActorId: 'player.henry',
      }),
      movement: { gait: 'canter', stamina: 67.6 },
      actorId: 'player.henry',
    });

    expect(viewModel.mounted).toBe(true);
    expect(viewModel.gait).toBe('canter');
    expect(viewModel.stamina).toBe(68);
    expect(viewModel.trial).toMatchObject({ active: true, checkpointIndex: 2, checkpointCount: 3 });
    expect(viewModel.statusLabel).toContain('canter');
  });

  it('does not expose mount unlock before the authoritative flag is set', () => {
    const viewModel = createHorseHudViewModel({
      snapshot: snapshot({ worldFlags: { 'horse.jiskra.claimed': true } }),
      actorId: 'player.henry',
    });

    expect(viewModel.claimed).toBe(true);
    expect(viewModel.mountUnlocked).toBe(false);
    expect(viewModel.mounted).toBe(false);
  });

  it('keeps terminal failure visible and clamps presentation values', () => {
    const viewModel = createHorseHudViewModel({
      snapshot: snapshot({
        failed: true,
        counters: {
          'horse.jiskra.trust_points': 99,
          'horse.jiskra.trial_checkpoint_index': 99,
        },
      }),
      movement: { gait: 'sprint', stamina: -4 },
      actorId: 'player.henry',
    });

    expect(viewModel.visible).toBe(true);
    expect(viewModel.failed).toBe(true);
    expect(viewModel.trust.current).toBe(3);
    expect(viewModel.trial.checkpointIndex).toBe(3);
    expect(viewModel.stamina).toBe(0);
    expect(viewModel.statusLabel).toBe('Jezdecký úkol selhal.');
  });
});
