export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm';
export type LightPhase = 'night' | 'dawn' | 'day' | 'dusk';

export interface WeatherProfile {
  kind: WeatherKind;
  label: string;
  overlayColor: number;
  overlayAlpha: number;
  cloudAlpha: number;
  rainDensity: number;
  rainSpeed: number;
  windX: number;
  wetness: number;
  visibility: number;
  lightningPeriodMs: number;
}

export interface LightingProfile {
  phase: LightPhase;
  label: string;
  tintColor: number;
  tintAlpha: number;
}

const WEATHER_PROFILES: Record<WeatherKind, WeatherProfile> = {
  clear: {
    kind: 'clear',
    label: 'Jasno',
    overlayColor: 0xf1d9a8,
    overlayAlpha: 0,
    cloudAlpha: 0,
    rainDensity: 0,
    rainSpeed: 0,
    windX: 0,
    wetness: 0,
    visibility: 1,
    lightningPeriodMs: 0
  },
  cloudy: {
    kind: 'cloudy',
    label: 'Zataženo',
    overlayColor: 0x52606a,
    overlayAlpha: 0.12,
    cloudAlpha: 0.14,
    rainDensity: 0,
    rainSpeed: 0,
    windX: 5,
    wetness: 0.08,
    visibility: 0.9,
    lightningPeriodMs: 0
  },
  rain: {
    kind: 'rain',
    label: 'Déšť',
    overlayColor: 0x344958,
    overlayAlpha: 0.2,
    cloudAlpha: 0.2,
    rainDensity: 58,
    rainSpeed: 190,
    windX: -24,
    wetness: 0.72,
    visibility: 0.78,
    lightningPeriodMs: 0
  },
  storm: {
    kind: 'storm',
    label: 'Bouře',
    overlayColor: 0x202d3a,
    overlayAlpha: 0.3,
    cloudAlpha: 0.28,
    rainDensity: 92,
    rainSpeed: 260,
    windX: -48,
    wetness: 1,
    visibility: 0.62,
    lightningPeriodMs: 4200
  }
};

const LIGHTING_PROFILES: Record<LightPhase, LightingProfile> = {
  night: {
    phase: 'night',
    label: 'Noc',
    tintColor: 0x27466c,
    tintAlpha: 0.08
  },
  dawn: {
    phase: 'dawn',
    label: 'Úsvit',
    tintColor: 0xd98758,
    tintAlpha: 0.13
  },
  day: {
    phase: 'day',
    label: 'Den',
    tintColor: 0xf2d7a2,
    tintAlpha: 0.045
  },
  dusk: {
    phase: 'dusk',
    label: 'Soumrak',
    tintColor: 0xb45f4c,
    tintAlpha: 0.14
  }
};

export const normalizeWorldHour = (hour: number): number => {
  if (!Number.isFinite(hour)) return 0;
  return ((hour % 24) + 24) % 24;
};

export const getWeatherKindAtHour = (hour: number): WeatherKind => {
  const normalized = normalizeWorldHour(hour);
  if (normalized < 4) return 'rain';
  if (normalized < 9) return 'clear';
  if (normalized < 12) return 'cloudy';
  if (normalized < 17) return 'rain';
  if (normalized < 19) return 'storm';
  if (normalized < 22) return 'cloudy';
  return 'clear';
};

export const getWeatherProfile = (kind: WeatherKind): WeatherProfile =>
  WEATHER_PROFILES[kind];

export const getLightPhaseAtHour = (hour: number): LightPhase => {
  const normalized = normalizeWorldHour(hour);
  if (normalized < 5 || normalized >= 21) return 'night';
  if (normalized < 8) return 'dawn';
  if (normalized < 18) return 'day';
  return 'dusk';
};

export const getLightingProfile = (hour: number): LightingProfile =>
  LIGHTING_PROFILES[getLightPhaseAtHour(hour)];

export const isLightningFlashActive = (timeMs: number, periodMs: number): boolean => {
  if (!Number.isFinite(timeMs) || !Number.isFinite(periodMs) || periodMs <= 0) return false;
  const phase = ((timeMs % periodMs) + periodMs) % periodMs;
  return phase < 70 || (phase >= 120 && phase < 165);
};
