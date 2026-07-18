import type Phaser from 'phaser';
import {
  ANIMAL_SPECIES,
  FAUNA_FRAME_HEIGHT,
  FAUNA_FRAME_STATES,
  FAUNA_FRAME_WIDTH,
  getFaunaAnimationKey,
  getFaunaFrameIndex,
  getFaunaTextureKey,
  type AnimalSpecies,
  type FaunaFrameState
} from '../data/fauna';

export interface FaunaPixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha?: number;
}

export interface FaunaFrameModel {
  state: FaunaFrameState;
  pixels: FaunaPixelRect[];
}

interface FaunaPalette {
  outline: number;
  body: number;
  shadow: number;
  accent: number;
  eye: number;
}

const PALETTES: Record<AnimalSpecies, FaunaPalette> = {
  hare: {
    outline: 0x241d18,
    body: 0x9f876b,
    shadow: 0x675545,
    accent: 0xc6b092,
    eye: 0x0c0907
  },
  'roe-deer': {
    outline: 0x211813,
    body: 0xa6653e,
    shadow: 0x663d29,
    accent: 0xd6b68b,
    eye: 0x090706
  },
  boar: {
    outline: 0x171513,
    body: 0x50473f,
    shadow: 0x312d29,
    accent: 0x887766,
    eye: 0xb08843
  }
};

const add = (
  pixels: FaunaPixelRect[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 1
): void => {
  if (width > 0 && height > 0) pixels.push({ x, y, width, height, color, alpha });
};

const drawShadow = (pixels: FaunaPixelRect[], dead: boolean): void => {
  add(pixels, dead ? 3 : 5, 15, dead ? 18 : 14, 2, 0x090807, dead ? 0.32 : 0.24);
};

const buildHare = (state: FaunaFrameState): FaunaFrameModel => {
  const pixels: FaunaPixelRect[] = [];
  const p = PALETTES.hare;
  const dead = state === 'dead';
  const hurt = state === 'hurt';
  const step = state === 'walk-a' ? -1 : state === 'walk-b' ? 1 : 0;
  drawShadow(pixels, dead);

  if (dead) {
    add(pixels, 4, 10, 15, 5, p.outline);
    add(pixels, 5, 9, 12, 5, p.body);
    add(pixels, 16, 8, 4, 5, p.shadow);
    add(pixels, 7, 8, 2, 2, p.accent);
    return { state, pixels };
  }

  add(pixels, 5, 8 + (hurt ? 1 : 0), 13, 7, p.outline);
  add(pixels, 6, 7 + (hurt ? 1 : 0), 11, 7, p.body);
  add(pixels, 15, 6 + (hurt ? 1 : 0), 6, 6, p.outline);
  add(pixels, 16, 6 + (hurt ? 1 : 0), 4, 5, p.body);
  add(pixels, 17, 7 + (hurt ? 1 : 0), 1, 1, p.eye);
  add(pixels, 19, 8 + (hurt ? 1 : 0), 2, 1, p.accent);
  add(pixels, 16, 1 + (hurt ? 2 : 0), 2, 6, p.outline);
  add(pixels, 19, 2 + (hurt ? 2 : 0), 2, 5, p.outline);
  add(pixels, 16, 2 + (hurt ? 2 : 0), 1, 4, p.accent);
  add(pixels, 19, 3 + (hurt ? 2 : 0), 1, 3, p.accent);
  add(pixels, 3, 9, 4, 4, p.accent);
  add(pixels, 7 + step, 13, 4, 3, p.shadow);
  add(pixels, 13 - step, 13, 4, 3, p.shadow);
  if (hurt) add(pixels, 11, 9, 3, 1, 0x9d2f2f);
  return { state, pixels };
};

const buildRoeDeer = (state: FaunaFrameState): FaunaFrameModel => {
  const pixels: FaunaPixelRect[] = [];
  const p = PALETTES['roe-deer'];
  const dead = state === 'dead';
  const hurt = state === 'hurt';
  const step = state === 'walk-a' ? -1 : state === 'walk-b' ? 1 : 0;
  drawShadow(pixels, dead);

  if (dead) {
    add(pixels, 2, 9, 20, 6, p.outline);
    add(pixels, 3, 8, 16, 6, p.body);
    add(pixels, 18, 7, 4, 5, p.shadow);
    add(pixels, 6, 13, 4, 2, p.accent);
    return { state, pixels };
  }

  add(pixels, 3, 7 + (hurt ? 1 : 0), 15, 8, p.outline);
  add(pixels, 4, 6 + (hurt ? 1 : 0), 13, 8, p.body);
  add(pixels, 15, 4 + (hurt ? 1 : 0), 7, 7, p.outline);
  add(pixels, 16, 4 + (hurt ? 1 : 0), 5, 6, p.body);
  add(pixels, 19, 5 + (hurt ? 1 : 0), 1, 1, p.eye);
  add(pixels, 20, 7 + (hurt ? 1 : 0), 3, 2, p.accent);
  add(pixels, 16, 1, 2, 4, p.shadow);
  add(pixels, 20, 1, 2, 4, p.shadow);
  add(pixels, 2, 7, 3, 3, p.accent);
  add(pixels, 5 + step, 13, 3, 4, p.shadow);
  add(pixels, 10 - step, 13, 3, 4, p.shadow);
  add(pixels, 14 + step, 13, 3, 4, p.shadow);
  add(pixels, 7, 8, 4, 3, p.accent, 0.42);
  if (hurt) add(pixels, 11, 8, 4, 1, 0x9d2f2f);
  return { state, pixels };
};

const buildBoar = (state: FaunaFrameState): FaunaFrameModel => {
  const pixels: FaunaPixelRect[] = [];
  const p = PALETTES.boar;
  const dead = state === 'dead';
  const hurt = state === 'hurt';
  const step = state === 'walk-a' ? -1 : state === 'walk-b' ? 1 : 0;
  drawShadow(pixels, dead);

  if (dead) {
    add(pixels, 2, 9, 21, 7, p.outline);
    add(pixels, 3, 8, 18, 7, p.body);
    add(pixels, 18, 10, 5, 4, p.shadow);
    add(pixels, 20, 13, 3, 1, p.accent);
    return { state, pixels };
  }

  add(pixels, 2, 6 + (hurt ? 1 : 0), 18, 10, p.outline);
  add(pixels, 3, 5 + (hurt ? 1 : 0), 16, 10, p.body);
  add(pixels, 16, 7 + (hurt ? 1 : 0), 7, 7, p.outline);
  add(pixels, 17, 7 + (hurt ? 1 : 0), 5, 6, p.shadow);
  add(pixels, 20, 8 + (hurt ? 1 : 0), 1, 1, p.eye);
  add(pixels, 21, 11 + (hurt ? 1 : 0), 3, 2, p.accent);
  add(pixels, 20, 13 + (hurt ? 1 : 0), 2, 1, 0xe6d8b7);
  add(pixels, 4, 4 + (hurt ? 1 : 0), 12, 3, p.shadow);
  add(pixels, 5 + step, 14, 4, 3, p.shadow);
  add(pixels, 13 - step, 14, 4, 3, p.shadow);
  add(pixels, 1, 8, 3, 2, p.accent);
  if (hurt) add(pixels, 10, 8, 4, 1, 0x9d2f2f);
  return { state, pixels };
};

export const buildFaunaFrame = (
  species: AnimalSpecies,
  state: FaunaFrameState
): FaunaFrameModel => {
  switch (species) {
    case 'hare':
      return buildHare(state);
    case 'roe-deer':
      return buildRoeDeer(state);
    case 'boar':
      return buildBoar(state);
  }
};

export const buildFaunaAtlas = (species: AnimalSpecies): FaunaFrameModel[] =>
  FAUNA_FRAME_STATES.map((state) => buildFaunaFrame(species, state));

export const validateFaunaFrame = (frame: FaunaFrameModel): string[] => {
  const errors: string[] = [];
  if (frame.pixels.length < 4) errors.push(`${frame.state}: fauna frame is too sparse`);
  for (const pixel of frame.pixels) {
    if (
      !Number.isInteger(pixel.x) ||
      !Number.isInteger(pixel.y) ||
      !Number.isInteger(pixel.width) ||
      !Number.isInteger(pixel.height)
    ) {
      errors.push(`${frame.state}: non-integer fauna rectangle`);
    }
    if (
      pixel.x < 0 ||
      pixel.y < 0 ||
      pixel.x + pixel.width > FAUNA_FRAME_WIDTH ||
      pixel.y + pixel.height > FAUNA_FRAME_HEIGHT
    ) {
      errors.push(`${frame.state}: rectangle outside ${FAUNA_FRAME_WIDTH}x${FAUNA_FRAME_HEIGHT}`);
    }
  }
  return errors;
};

export const registerFaunaAtlases = (scene: Phaser.Scene): void => {
  for (const species of Object.keys(ANIMAL_SPECIES) as AnimalSpecies[]) {
    const key = getFaunaTextureKey(species);
    if (scene.textures.exists(key)) continue;
    const frames = buildFaunaAtlas(species);
    const graphics = scene.add.graphics();

    for (const frame of frames) {
      const index = getFaunaFrameIndex(frame.state);
      const offsetX = index * FAUNA_FRAME_WIDTH;
      for (const pixel of frame.pixels) {
        graphics.fillStyle(pixel.color, pixel.alpha ?? 1);
        graphics.fillRect(offsetX + pixel.x, pixel.y, pixel.width, pixel.height);
      }
    }

    graphics.generateTexture(key, FAUNA_FRAME_WIDTH * frames.length, FAUNA_FRAME_HEIGHT);
    graphics.destroy();
    const texture = scene.textures.get(key);
    for (const frame of frames) {
      const index = getFaunaFrameIndex(frame.state);
      texture.add(index, 0, index * FAUNA_FRAME_WIDTH, 0, FAUNA_FRAME_WIDTH, FAUNA_FRAME_HEIGHT);
    }

    scene.anims.create({
      key: getFaunaAnimationKey(species, 'idle'),
      frames: [{ key, frame: getFaunaFrameIndex('idle') }],
      frameRate: 1,
      repeat: -1
    });
    scene.anims.create({
      key: getFaunaAnimationKey(species, 'walk'),
      frames: ['walk-a', 'idle', 'walk-b', 'idle'].map((state) => ({
        key,
        frame: getFaunaFrameIndex(state as FaunaFrameState)
      })),
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: getFaunaAnimationKey(species, 'hurt'),
      frames: [
        { key, frame: getFaunaFrameIndex('hurt') },
        { key, frame: getFaunaFrameIndex('idle') }
      ],
      frameRate: 7,
      repeat: 0
    });
    scene.anims.create({
      key: getFaunaAnimationKey(species, 'dead'),
      frames: [{ key, frame: getFaunaFrameIndex('dead') }],
      frameRate: 1,
      repeat: 0
    });
  }

  document.body.dataset.faunaAtlases = String(Object.keys(ANIMAL_SPECIES).length);
};
