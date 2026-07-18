export type MusicMood =
  | 'silent'
  | 'dawn'
  | 'day'
  | 'evening'
  | 'night'
  | 'suspicious'
  | 'alerted';

export type MusicLayer = 'ambience' | 'drone' | 'melody' | 'pulse' | 'percussion';

export interface MusicMotifDefinition {
  mood: MusicMood;
  tempo: number;
  rootFrequency: number;
  melodyRatios: readonly number[];
  bassRatios: readonly number[];
  stepBeats: number;
  filterFrequency: number;
}

export const MUSIC_MOTIFS: Record<Exclude<MusicMood, 'silent'>, MusicMotifDefinition> = {
  dawn: {
    mood: 'dawn',
    tempo: 66,
    rootFrequency: 146.83,
    melodyRatios: [1, 1.125, 1.25, 1.5, 1.25, 1.125, 1.333, 1.5],
    bassRatios: [0.5, 0.667, 0.75, 0.667],
    stepBeats: 1,
    filterFrequency: 1700
  },
  day: {
    mood: 'day',
    tempo: 78,
    rootFrequency: 164.81,
    melodyRatios: [1, 1.25, 1.5, 1.333, 1.5, 1.875, 1.667, 1.25],
    bassRatios: [0.5, 0.75, 0.667, 0.75],
    stepBeats: 0.5,
    filterFrequency: 2300
  },
  evening: {
    mood: 'evening',
    tempo: 70,
    rootFrequency: 146.83,
    melodyRatios: [1.5, 1.333, 1.25, 1.125, 1, 1.125, 1.25, 0.889],
    bassRatios: [0.5, 0.667, 0.625, 0.5],
    stepBeats: 1,
    filterFrequency: 1400
  },
  night: {
    mood: 'night',
    tempo: 56,
    rootFrequency: 130.81,
    melodyRatios: [1, 1.2, 1.5, 1.333, 1.125, 1.2, 1, 0.8],
    bassRatios: [0.5, 0.6, 0.667, 0.6],
    stepBeats: 1.5,
    filterFrequency: 900
  },
  suspicious: {
    mood: 'suspicious',
    tempo: 92,
    rootFrequency: 138.59,
    melodyRatios: [1, 1.059, 1.2, 1.059, 1.25, 1.2, 1.059, 0.944],
    bassRatios: [0.5, 0.53, 0.5, 0.47],
    stepBeats: 0.5,
    filterFrequency: 1250
  },
  alerted: {
    mood: 'alerted',
    tempo: 124,
    rootFrequency: 146.83,
    melodyRatios: [1, 1.5, 1.125, 1.667, 1, 1.5, 1.2, 1.778],
    bassRatios: [0.5, 0.5, 0.667, 0.56],
    stepBeats: 0.25,
    filterFrequency: 2800
  }
};

export const MUSIC_LAYER_ORDER: readonly MusicLayer[] = [
  'ambience',
  'drone',
  'melody',
  'pulse',
  'percussion'
];
