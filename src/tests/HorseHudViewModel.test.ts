import { describe, expect, it } from 'vitest';
import {
  createHorseHudViewModel,
  type HorseHudPresentationInput,
} from '../game/ui/HorseHudViewModel';

const presentation = (
  overrides: Partial<HorseHudPresentationInput> = {},
): HorseHudPresentationInput => ({
  trustCurrent: 0,
  solution: null,
  claimed: false,
  mounted: false,
  mountUnlocked: false,
  gait: 'idle',
  stamina: 100,
  trialActive: false,
  trialCompleted: false,
  trialCheckpointIndex: 0,
  failed: false,
  feedback: null,
  ...overrides,
});

describe('createHorseHudViewModel', () => {
  it('maps live trust and mount unlock presentation state without mutating its input', () => {
    const source = presentation({
      trustCurrent: 3,
      solution: 'lawful_service',
      claimed: true,
      mountUnlocked: true,
    });
    const before = JSON.stringify(source);

    const viewModel = createHorseHudViewModel(source);

    expect(viewModel.trust).toEqual({ current: 3, target: 3, label: 'Důvěra 3/3' });
    expect(viewModel.claimed).toBe(true);
    expect(viewModel.mountUnlocked).toBe(true);
    expect(viewModel.mounted).toBe(false);
    expect(viewModel.solution).toBe('lawful_service');
    expect(JSON.stringify(source)).toBe(before);
  });

  it('shows mounted gait, stamina and trial checkpoint progress from presentation inputs', () => {
    const viewModel = createHorseHudViewModel(
      presentation({
        claimed: true,
        mounted: true,
        mountUnlocked: true,
        gait: 'canter',
        stamina: 67.6,
        trialActive: true,
        trialCheckpointIndex: 2,
      }),
    );

    expect(viewModel.mounted).toBe(true);
    expect(viewModel.gait).toBe('canter');
    expect(viewModel.stamina).toBe(68);
    expect(viewModel.trial).toMatchObject({ active: true, checkpointIndex: 2, checkpointCount: 3 });
    expect(viewModel.statusLabel).toContain('canter');
  });

  it('does not expose mount unlock before the live flag is set', () => {
    const viewModel = createHorseHudViewModel(presentation({ claimed: true }));

    expect(viewModel.claimed).toBe(true);
    expect(viewModel.mountUnlocked).toBe(false);
    expect(viewModel.mounted).toBe(false);
  });

  it('keeps terminal failure visible and clamps presentation values', () => {
    const viewModel = createHorseHudViewModel(
      presentation({
        trustCurrent: 99,
        trialCheckpointIndex: 99,
        gait: 'sprint',
        stamina: -4,
        failed: true,
      }),
    );

    expect(viewModel.visible).toBe(true);
    expect(viewModel.failed).toBe(true);
    expect(viewModel.trust.current).toBe(3);
    expect(viewModel.trial.checkpointIndex).toBe(3);
    expect(viewModel.stamina).toBe(0);
    expect(viewModel.statusLabel).toBe('Jezdecký úkol selhal.');
  });

  it('carries trimmed horse-specific feedback independently from global messages', () => {
    const viewModel = createHorseHudViewModel(
      presentation({ feedback: '  Nasednutí ještě není odemčené.  ' }),
    );

    expect(viewModel.feedback).toBe('Nasednutí ještě není odemčené.');
    expect(createHorseHudViewModel(presentation({ feedback: '   ' })).feedback).toBeNull();
  });
});
