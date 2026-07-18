import { describe, expect, it } from 'vitest';
import { MUSIC_MOTIFS } from '../data/music';
import {
  getAmbientMusicMood,
  getMusicMood,
  getMusicState,
  getMusicStepDuration,
  normalizeMusicHour
} from '../systems/MusicSystem';

describe('MusicSystem', () => {
  it('rozdělí den do čtyř odlišných ambientních nálad', () => {
    expect(getAmbientMusicMood(5)).toBe('dawn');
    expect(getAmbientMusicMood(7.99)).toBe('dawn');
    expect(getAmbientMusicMood(8)).toBe('day');
    expect(getAmbientMusicMood(17.99)).toBe('day');
    expect(getAmbientMusicMood(18)).toBe('evening');
    expect(getAmbientMusicMood(21.99)).toBe('evening');
    expect(getAmbientMusicMood(22)).toBe('night');
    expect(getAmbientMusicMood(3)).toBe('night');
  });

  it('normalizuje zápornou i přetečenou hodinu', () => {
    expect(normalizeMusicHour(-1)).toBe(23);
    expect(normalizeMusicHour(25)).toBe(1);
    expect(normalizeMusicHour(Number.NaN)).toBe(0);
  });

  it('podezření a poplach přepíší denní motiv', () => {
    expect(
      getMusicMood({ sceneActive: true, worldHour: 12, stealthLevel: 'suspicious', muted: false })
    ).toBe('suspicious');
    expect(
      getMusicMood({ sceneActive: true, worldHour: 2, stealthLevel: 'alerted', muted: false })
    ).toBe('alerted');
  });

  it('mimo hru nebo při ztlumení vrátí ticho', () => {
    expect(
      getMusicMood({ sceneActive: false, worldHour: 12, stealthLevel: 'unaware', muted: false })
    ).toBe('silent');
    expect(
      getMusicMood({ sceneActive: true, worldHour: 12, stealthLevel: 'unaware', muted: true })
    ).toBe('silent');
  });

  it('poplach aktivuje výrazně více pulzu a perkusí než klidný den', () => {
    const day = getMusicState({
      sceneActive: true,
      worldHour: 12,
      stealthLevel: 'unaware',
      muted: false
    });
    const alert = getMusicState({
      sceneActive: true,
      worldHour: 12,
      stealthLevel: 'alerted',
      muted: false
    });

    expect(alert.layers.pulse).toBeGreaterThan(day.layers.pulse);
    expect(alert.layers.percussion).toBeGreaterThan(day.layers.percussion);
    expect(alert.motif?.tempo).toBeGreaterThan(day.motif?.tempo ?? 0);
  });

  it('každá aktivní nálada má plný osmistrunný melodický motiv', () => {
    for (const motif of Object.values(MUSIC_MOTIFS)) {
      expect(motif.melodyRatios).toHaveLength(8);
      expect(motif.bassRatios).toHaveLength(4);
      expect(getMusicStepDuration(motif)).toBeGreaterThan(0);
    }
  });

  it('tichý stav má nulovou hlasitost všech vrstev', () => {
    const state = getMusicState({
      sceneActive: true,
      worldHour: 12,
      stealthLevel: 'unaware',
      muted: true
    });

    expect(state.mood).toBe('silent');
    expect(state.motif).toBeNull();
    expect(Object.values(state.layers).every((gain) => gain === 0)).toBe(true);
  });
});
