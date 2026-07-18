import {
  MUSIC_MOTIFS,
  type MusicLayer,
  type MusicMood,
  type MusicMotifDefinition
} from '../data/music';
import type { AwarenessLevel } from './StealthSystem';

export interface MusicContext {
  sceneActive: boolean;
  worldHour: number;
  stealthLevel: AwarenessLevel;
  muted: boolean;
}

export type MusicLayerMix = Record<MusicLayer, number>;

export interface MusicState {
  mood: MusicMood;
  motif: MusicMotifDefinition | null;
  layers: MusicLayerMix;
}

const SILENT_MIX: MusicLayerMix = {
  ambience: 0,
  drone: 0,
  melody: 0,
  pulse: 0,
  percussion: 0
};

const MOOD_MIXES: Record<Exclude<MusicMood, 'silent'>, MusicLayerMix> = {
  dawn: {
    ambience: 0.7,
    drone: 0.38,
    melody: 0.42,
    pulse: 0.05,
    percussion: 0
  },
  day: {
    ambience: 0.45,
    drone: 0.34,
    melody: 0.58,
    pulse: 0.08,
    percussion: 0.06
  },
  evening: {
    ambience: 0.58,
    drone: 0.44,
    melody: 0.4,
    pulse: 0.08,
    percussion: 0.02
  },
  night: {
    ambience: 0.76,
    drone: 0.5,
    melody: 0.24,
    pulse: 0.08,
    percussion: 0
  },
  suspicious: {
    ambience: 0.28,
    drone: 0.48,
    melody: 0.18,
    pulse: 0.62,
    percussion: 0.26
  },
  alerted: {
    ambience: 0.12,
    drone: 0.52,
    melody: 0.34,
    pulse: 0.82,
    percussion: 0.9
  }
};

export const normalizeMusicHour = (hour: number): number => {
  if (!Number.isFinite(hour)) return 0;
  return ((hour % 24) + 24) % 24;
};

export const getAmbientMusicMood = (
  worldHour: number
): Exclude<MusicMood, 'silent' | 'suspicious' | 'alerted'> => {
  const hour = normalizeMusicHour(worldHour);
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

export const getMusicMood = (context: MusicContext): MusicMood => {
  if (!context.sceneActive || context.muted) return 'silent';
  if (context.stealthLevel === 'alerted') return 'alerted';
  if (context.stealthLevel === 'suspicious') return 'suspicious';
  return getAmbientMusicMood(context.worldHour);
};

export const getMusicState = (context: MusicContext): MusicState => {
  const mood = getMusicMood(context);
  if (mood === 'silent') {
    return { mood, motif: null, layers: { ...SILENT_MIX } };
  }

  return {
    mood,
    motif: MUSIC_MOTIFS[mood],
    layers: { ...MOOD_MIXES[mood] }
  };
};

export const getMusicMoodLabel = (mood: MusicMood): string => {
  const labels: Record<MusicMood, string> = {
    silent: 'Ticho',
    dawn: 'Úsvit',
    day: 'Denní cesta',
    evening: 'Soumrak',
    night: 'Noční hlídka',
    suspicious: 'Podezření',
    alerted: 'Poplach'
  };
  return labels[mood];
};

export const getMusicStepDuration = (motif: MusicMotifDefinition): number =>
  (60 / motif.tempo) * motif.stepBeats;
