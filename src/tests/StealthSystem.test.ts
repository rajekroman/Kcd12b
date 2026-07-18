import { describe, expect, it } from 'vitest';
import {
  createInitialSuspicionState,
  getAwarenessLevel,
  normalizeVector,
  sampleVisionCone,
  updateSuspicion
} from '../systems/StealthSystem';

describe('StealthSystem', () => {
  const cone = {
    origin: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    range: 100,
    halfAngleDegrees: 30
  };

  it('vidí cíl před pozorovatelem uvnitř vzdálenosti a úhlu', () => {
    const sample = sampleVisionCone(cone, { x: 60, y: 10 });

    expect(sample.visible).toBe(true);
    expect(sample.distance).toBeCloseTo(Math.hypot(60, 10));
    expect(sample.angleDegrees).toBeLessThan(30);
  });

  it('nevidí cíl za zády ani mimo dosah', () => {
    expect(sampleVisionCone(cone, { x: -20, y: 0 }).visible).toBe(false);
    expect(sampleVisionCone(cone, { x: 101, y: 0 }).visible).toBe(false);
  });

  it('považuje přesnou hranici kuželu a dosahu za viditelnou', () => {
    const radians = (30 * Math.PI) / 180;
    const target = { x: Math.cos(radians) * 100, y: Math.sin(radians) * 100 };
    const sample = sampleVisionCone(cone, target);

    expect(sample.distance).toBeCloseTo(100);
    expect(sample.angleDegrees).toBeCloseTo(30);
    expect(sample.visible).toBe(true);
  });

  it('normalizuje směr a bezpečně použije fallback pro nulový vektor', () => {
    expect(normalizeVector({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
    expect(normalizeVector({ x: 0, y: 0 })).toEqual({ x: 1, y: 0 });
  });

  it('blízký viditelný cíl zvyšuje podezření rychleji než vzdálený', () => {
    const state = createInitialSuspicionState();
    const close = updateSuspicion({
      state,
      sample: { visible: true, distance: 10, distanceRatio: 0.1, angleDegrees: 0 },
      deltaMs: 1000,
      now: 1000
    });
    const far = updateSuspicion({
      state,
      sample: { visible: true, distance: 90, distanceRatio: 0.9, angleDegrees: 0 },
      deltaMs: 1000,
      now: 1000
    });

    expect(close.value).toBeGreaterThan(far.value);
    expect(close.lastSeenAt).toBe(1000);
  });

  it('přechází z klidu přes podezření do poplachu', () => {
    let state = createInitialSuspicionState();
    const sample = { visible: true, distance: 20, distanceRatio: 0.2, angleDegrees: 0 };

    state = updateSuspicion({ state, sample, deltaMs: 400, now: 400 });
    expect(state.level).toBe('suspicious');

    state = updateSuspicion({ state, sample, deltaMs: 1200, now: 1600 });
    expect(state.level).toBe('alerted');
    expect(state.value).toBe(100);
  });

  it('mimo dohled podezření postupně klesá až do klidu', () => {
    const suspicious = {
      value: 55,
      level: 'suspicious' as const,
      lastSeenAt: 500
    };
    const hidden = { visible: false, distance: 150, distanceRatio: 1.5, angleDegrees: 80 };
    const decayed = updateSuspicion({
      state: suspicious,
      sample: hidden,
      deltaMs: 4000,
      now: 4500
    });

    expect(decayed.value).toBe(0);
    expect(decayed.level).toBe('unaware');
    expect(decayed.lastSeenAt).toBe(500);
  });

  it('mapuje prahy povědomí deterministicky', () => {
    expect(getAwarenessLevel(0)).toBe('unaware');
    expect(getAwarenessLevel(29.9)).toBe('unaware');
    expect(getAwarenessLevel(30)).toBe('suspicious');
    expect(getAwarenessLevel(99.9)).toBe('suspicious');
    expect(getAwarenessLevel(100)).toBe('alerted');
  });
});
