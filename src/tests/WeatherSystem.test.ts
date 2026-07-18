import { describe, expect, it } from 'vitest';
import {
  getLightingProfile,
  getLightPhaseAtHour,
  getWeatherKindAtHour,
  getWeatherProfile,
  isLightningFlashActive,
  normalizeWorldHour
} from '../systems/WeatherSystem';

describe('WeatherSystem', () => {
  it('normalizuje světovou hodinu do intervalu 0 až 24', () => {
    expect(normalizeWorldHour(25)).toBe(1);
    expect(normalizeWorldHour(-1)).toBe(23);
    expect(normalizeWorldHour(Number.NaN)).toBe(0);
  });

  it('používá deterministický denní cyklus počasí', () => {
    expect(getWeatherKindAtHour(2)).toBe('rain');
    expect(getWeatherKindAtHour(6)).toBe('clear');
    expect(getWeatherKindAtHour(10)).toBe('cloudy');
    expect(getWeatherKindAtHour(14)).toBe('rain');
    expect(getWeatherKindAtHour(18)).toBe('storm');
    expect(getWeatherKindAtHour(20)).toBe('cloudy');
    expect(getWeatherKindAtHour(23)).toBe('clear');
  });

  it('přiřadí počasí čitelné parametry viditelnosti a mokra', () => {
    const clear = getWeatherProfile('clear');
    const rain = getWeatherProfile('rain');
    const storm = getWeatherProfile('storm');

    expect(clear.rainDensity).toBe(0);
    expect(clear.wetness).toBe(0);
    expect(rain.rainDensity).toBeGreaterThan(40);
    expect(rain.wetness).toBeGreaterThan(0.5);
    expect(storm.rainDensity).toBeGreaterThan(rain.rainDensity);
    expect(storm.visibility).toBeLessThan(rain.visibility);
  });

  it('rozdělí den na noc, úsvit, den a soumrak', () => {
    expect(getLightPhaseAtHour(3)).toBe('night');
    expect(getLightPhaseAtHour(6)).toBe('dawn');
    expect(getLightPhaseAtHour(12)).toBe('day');
    expect(getLightPhaseAtHour(19)).toBe('dusk');
    expect(getLightingProfile(19).tintAlpha).toBeGreaterThan(
      getLightingProfile(12).tintAlpha
    );
  });

  it('vytvoří dva krátké deterministické záblesky v bouřkovém cyklu', () => {
    expect(isLightningFlashActive(0, 4200)).toBe(true);
    expect(isLightningFlashActive(80, 4200)).toBe(false);
    expect(isLightningFlashActive(130, 4200)).toBe(true);
    expect(isLightningFlashActive(200, 4200)).toBe(false);
    expect(isLightningFlashActive(4200, 4200)).toBe(true);
    expect(isLightningFlashActive(100, 0)).toBe(false);
  });
});
