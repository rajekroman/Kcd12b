import type Phaser from 'phaser';
import {
  CHARACTER_ATLAS_DEFINITIONS,
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_STATES,
  CHARACTER_FRAME_WIDTH,
  getCharacterAnimationKey,
  getCharacterFrameIndex,
  type CharacterAccessory,
  type CharacterAtlasDefinition,
  type CharacterFrameState,
  type Headwear
} from '../data/characterAtlases';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha?: number;
}

export interface CharacterFrameModel {
  state: CharacterFrameState;
  pixels: PixelRect[];
}

const rect = (
  pixels: PixelRect[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 1
): void => {
  if (width <= 0 || height <= 0) return;
  pixels.push({ x, y, width, height, color, alpha });
};

const drawGroundShadow = (pixels: PixelRect[], state: CharacterFrameState): void => {
  if (state === 'sleep') {
    rect(pixels, 2, 23, 16, 2, 0x090807, 0.32);
    return;
  }
  rect(pixels, 4, 25, 12, 2, 0x090807, 0.34);
  rect(pixels, 6, 24, 8, 1, 0x090807, 0.2);
};

const drawHeadwear = (
  pixels: PixelRect[],
  headwear: Headwear,
  definition: CharacterAtlasDefinition,
  offsetX: number,
  offsetY: number
): void => {
  const { palette } = definition;
  switch (headwear) {
    case 'none':
      rect(pixels, offsetX + 7, offsetY + 2, 6, 2, palette.hair);
      rect(pixels, offsetX + 6, offsetY + 3, 2, 4, palette.hair);
      break;
    case 'hood':
      rect(pixels, offsetX + 5, offsetY + 1, 10, 2, palette.primaryShadow);
      rect(pixels, offsetX + 4, offsetY + 3, 3, 7, palette.primaryShadow);
      rect(pixels, offsetX + 13, offsetY + 3, 3, 7, palette.primaryShadow);
      rect(pixels, offsetX + 6, offsetY + 2, 8, 2, palette.primary);
      break;
    case 'cap':
      rect(pixels, offsetX + 5, offsetY + 1, 9, 2, palette.secondaryShadow);
      rect(pixels, offsetX + 4, offsetY + 3, 11, 2, palette.secondary);
      rect(pixels, offsetX + 13, offsetY + 2, 3, 1, palette.secondaryShadow);
      break;
    case 'helmet':
      rect(pixels, offsetX + 5, offsetY + 1, 10, 2, palette.metal);
      rect(pixels, offsetX + 4, offsetY + 3, 12, 3, palette.metal);
      rect(pixels, offsetX + 5, offsetY + 6, 2, 3, palette.primaryShadow);
      rect(pixels, offsetX + 13, offsetY + 6, 2, 3, palette.primaryShadow);
      rect(pixels, offsetX + 9, offsetY, 2, 2, palette.accent);
      break;
    case 'straw-hat':
      rect(pixels, offsetX + 3, offsetY + 2, 14, 2, palette.accent);
      rect(pixels, offsetX + 6, offsetY, 8, 3, palette.secondary);
      rect(pixels, offsetX + 7, offsetY + 1, 6, 1, palette.secondaryShadow);
      break;
    case 'veil':
      rect(pixels, offsetX + 5, offsetY + 1, 10, 3, palette.accent);
      rect(pixels, offsetX + 4, offsetY + 4, 2, 8, palette.accent);
      rect(pixels, offsetX + 14, offsetY + 4, 2, 8, palette.accent);
      break;
    case 'cowl':
      rect(pixels, offsetX + 4, offsetY + 1, 12, 3, palette.primaryShadow);
      rect(pixels, offsetX + 3, offsetY + 4, 3, 8, palette.primaryShadow);
      rect(pixels, offsetX + 14, offsetY + 4, 3, 8, palette.primaryShadow);
      break;
    case 'headscarf':
      rect(pixels, offsetX + 5, offsetY + 1, 10, 3, palette.accent);
      rect(pixels, offsetX + 4, offsetY + 4, 3, 4, palette.accent);
      rect(pixels, offsetX + 13, offsetY + 4, 3, 4, palette.accent);
      rect(pixels, offsetX + 14, offsetY + 7, 2, 5, palette.accent);
      break;
  }
};

const drawAccessory = (
  pixels: PixelRect[],
  accessory: CharacterAccessory,
  definition: CharacterAtlasDefinition,
  state: CharacterFrameState,
  leanX: number
): void => {
  const { palette } = definition;
  const active = state === 'action';
  const rightX = leanX + (active ? 16 : 15);
  const handY = active ? 11 : 14;

  switch (accessory) {
    case 'none':
      break;
    case 'sword':
      rect(pixels, rightX, handY, 1, active ? 10 : 8, palette.metal);
      rect(pixels, rightX - 1, handY + (active ? 8 : 1), 3, 1, palette.accent);
      rect(pixels, rightX, handY + (active ? 9 : 2), 1, 4, palette.secondaryShadow);
      break;
    case 'hammer':
      rect(pixels, rightX, handY, 2, active ? 9 : 7, palette.secondaryShadow);
      rect(pixels, rightX - 2, handY - 1, 6, 3, palette.metal);
      break;
    case 'tankard':
      rect(pixels, rightX - 1, handY, 4, 5, palette.metal);
      rect(pixels, rightX + 3, handY + 1, 2, 3, palette.metal);
      rect(pixels, rightX, handY + 1, 2, 1, palette.accent);
      break;
    case 'spear':
      rect(pixels, rightX, active ? 3 : 5, 1, 21, palette.secondaryShadow);
      rect(pixels, rightX - 1, active ? 1 : 3, 3, 3, palette.metal);
      break;
    case 'hoe':
      rect(pixels, rightX, 8, 1, 17, palette.secondaryShadow);
      rect(pixels, rightX - (active ? 4 : 1), 7, active ? 6 : 4, 2, palette.metal);
      break;
    case 'herb-basket':
      rect(pixels, rightX - 2, 16, 6, 6, palette.secondaryShadow);
      rect(pixels, rightX - 1, 15, 4, 1, palette.accent);
      rect(pixels, rightX, 13, 1, 3, palette.primary);
      rect(pixels, rightX + 2, 12, 1, 4, palette.accent);
      break;
    case 'flour-sack':
      rect(pixels, rightX - 3, 14, 7, 9, palette.accent);
      rect(pixels, rightX - 2, 13, 5, 2, palette.primaryShadow);
      rect(pixels, rightX - 1, 17, 3, 1, palette.secondaryShadow);
      break;
    case 'cross':
      rect(pixels, 9 + leanX, 11, 2, 7, palette.accent);
      rect(pixels, 7 + leanX, 13, 6, 2, palette.accent);
      break;
    case 'merchant-pouch':
      rect(pixels, rightX - 2, 16, 5, 6, palette.secondaryShadow);
      rect(pixels, rightX - 1, 15, 3, 2, palette.accent);
      rect(pixels, rightX, 18, 1, 1, palette.metal);
      break;
    case 'horse-brush':
      rect(pixels, rightX - 2, handY, 5, 3, palette.secondaryShadow);
      rect(pixels, rightX - 1, handY + 3, 3, 2, palette.accent);
      break;
    case 'linen-basket':
      rect(pixels, rightX - 4, 16, 8, 6, palette.secondaryShadow);
      rect(pixels, rightX - 3, 15, 6, 2, palette.accent);
      rect(pixels, rightX - 2, 17, 2, 3, 0xd8d0bc);
      rect(pixels, rightX + 1, 17, 2, 4, 0xb8c4c7);
      break;
    case 'club':
      rect(pixels, rightX, active ? 5 : 10, 2, active ? 15 : 12, palette.secondaryShadow);
      rect(pixels, rightX - 1, active ? 3 : 8, 4, 4, palette.primaryShadow);
      break;
  }
};

const drawSleepingFrame = (definition: CharacterAtlasDefinition): PixelRect[] => {
  const pixels: PixelRect[] = [];
  const { palette } = definition;
  drawGroundShadow(pixels, 'sleep');
  rect(pixels, 3, 15, 14, 6, palette.outline);
  rect(pixels, 4, 14, 7, 6, palette.skinShadow);
  rect(pixels, 5, 13, 6, 6, palette.skin);
  rect(pixels, 11, 14, 7, 7, palette.primaryShadow);
  rect(pixels, 10, 15, 7, 5, palette.primary);
  rect(pixels, 15, 13, 3, 3, palette.secondary);
  rect(pixels, 6, 15, 1, 1, palette.outline);
  drawHeadwear(pixels, definition.headwear, definition, -1, 10);
  return pixels;
};

export const buildCharacterFrame = (
  definition: CharacterAtlasDefinition,
  state: CharacterFrameState
): CharacterFrameModel => {
  if (state === 'sleep') return { state, pixels: drawSleepingFrame(definition) };

  const pixels: PixelRect[] = [];
  const { palette } = definition;
  const leanX = state === 'hurt' ? -1 : 0;
  const headY = state === 'action' ? 0 : state === 'hurt' ? 2 : 1;
  const shoulderWidth = definition.broadShoulders ? 12 : 10;
  const bodyX = leanX + (20 - shoulderWidth) / 2;
  const bodyY = 10;
  const legShift = state === 'walk-a' ? -1 : state === 'walk-b' ? 1 : 0;
  const armLift = state === 'action' ? -4 : 0;

  drawGroundShadow(pixels, state);

  rect(pixels, 6 + leanX, headY + 2, 8, 8, palette.outline);
  rect(pixels, 7 + leanX, headY + 3, 6, 6, palette.skinShadow);
  rect(pixels, 7 + leanX, headY + 2, 6, 5, palette.skin);
  rect(pixels, 8 + leanX, headY + 5, 1, 1, palette.outline);
  rect(pixels, 12 + leanX, headY + 5, 1, 1, palette.outline);
  rect(pixels, 10 + leanX, headY + 7, 2, 1, palette.skinShadow);

  if (definition.beard) {
    rect(pixels, 7 + leanX, headY + 7, 6, 3, palette.hair);
    rect(pixels, 9 + leanX, headY + 9, 3, 2, palette.hair);
  } else {
    rect(pixels, 6 + leanX, headY + 2, 2, 5, palette.hair);
    rect(pixels, 12 + leanX, headY + 2, 2, 3, palette.hair);
  }

  drawHeadwear(pixels, definition.headwear, definition, leanX, headY);

  rect(pixels, bodyX - 1, bodyY, shoulderWidth + 2, 2, palette.outline);
  rect(pixels, bodyX, bodyY, shoulderWidth, definition.longGarment ? 12 : 9, palette.primaryShadow);
  rect(pixels, bodyX + 1, bodyY, shoulderWidth - 2, definition.longGarment ? 11 : 8, palette.primary);
  rect(pixels, bodyX + 2, bodyY + 1, 2, 6, palette.accent, 0.7);

  if (definition.feminineSilhouette) {
    rect(pixels, bodyX - 1, bodyY + 7, shoulderWidth + 2, definition.longGarment ? 7 : 5, palette.primaryShadow);
    rect(pixels, bodyX, bodyY + 7, shoulderWidth, definition.longGarment ? 6 : 4, palette.primary);
  }

  if (definition.apron) {
    rect(pixels, 7 + leanX, 12, 6, 9, palette.accent);
    rect(pixels, 8 + leanX, 13, 4, 7, palette.secondary);
  }

  rect(pixels, bodyX - 2, bodyY + 1 + armLift, 2, 8, palette.outline);
  rect(pixels, bodyX - 1, bodyY + 2 + armLift, 2, 6, palette.primaryShadow);
  rect(pixels, bodyX + shoulderWidth, bodyY + 1 + armLift, 2, 8, palette.outline);
  rect(pixels, bodyX + shoulderWidth - 1, bodyY + 2 + armLift, 2, 6, palette.primaryShadow);
  rect(pixels, bodyX - 2, bodyY + 8 + armLift, 2, 2, palette.skin);
  rect(pixels, bodyX + shoulderWidth, bodyY + 8 + armLift, 2, 2, palette.skin);

  if (!definition.longGarment) {
    rect(pixels, 6 + leanX + legShift, 19, 4, 6, palette.outline);
    rect(pixels, 7 + leanX + legShift, 19, 3, 5, palette.secondary);
    rect(pixels, 11 + leanX - legShift, 19, 4, 6, palette.outline);
    rect(pixels, 11 + leanX - legShift, 19, 3, 5, palette.secondaryShadow);
    rect(pixels, 5 + leanX + legShift, 24, 5, 2, palette.outline);
    rect(pixels, 11 + leanX - legShift, 24, 5, 2, palette.outline);
  } else {
    rect(pixels, 5 + leanX, 18, 10, 7, palette.outline);
    rect(pixels, 6 + leanX, 18, 8, 6, palette.primaryShadow);
    rect(pixels, 7 + leanX + legShift, 24, 3, 2, palette.outline);
    rect(pixels, 11 + leanX - legShift, 24, 3, 2, palette.outline);
  }

  drawAccessory(pixels, definition.accessory, definition, state, leanX);

  if (state === 'hurt') {
    rect(pixels, 8 + leanX, 13, 3, 1, definition.damaged ? palette.accent : 0x8c2e2e);
    rect(pixels, 11 + leanX, 15, 2, 1, 0x8c2e2e);
  }
  if (definition.damaged) {
    rect(pixels, 5 + leanX, 14, 2, 1, palette.accent);
    rect(pixels, 12 + leanX, 18, 2, 1, palette.accent);
  }

  return { state, pixels };
};

export const buildCharacterAtlas = (
  definition: CharacterAtlasDefinition
): CharacterFrameModel[] =>
  CHARACTER_FRAME_STATES.map((state) => buildCharacterFrame(definition, state));

export const validateCharacterFrame = (frame: CharacterFrameModel): string[] => {
  const errors: string[] = [];
  if (frame.pixels.length === 0) errors.push(`${frame.state}: empty frame`);
  for (const pixel of frame.pixels) {
    if (
      !Number.isInteger(pixel.x) ||
      !Number.isInteger(pixel.y) ||
      !Number.isInteger(pixel.width) ||
      !Number.isInteger(pixel.height)
    ) {
      errors.push(`${frame.state}: non-integer pixel rectangle`);
    }
    if (
      pixel.x < 0 ||
      pixel.y < 0 ||
      pixel.x + pixel.width > CHARACTER_FRAME_WIDTH ||
      pixel.y + pixel.height > CHARACTER_FRAME_HEIGHT
    ) {
      errors.push(`${frame.state}: rectangle outside ${CHARACTER_FRAME_WIDTH}x${CHARACTER_FRAME_HEIGHT}`);
    }
  }
  return errors;
};

export const registerCharacterAtlases = (scene: Phaser.Scene): void => {
  for (const definition of CHARACTER_ATLAS_DEFINITIONS) {
    if (scene.textures.exists(definition.key)) continue;
    const frames = buildCharacterAtlas(definition);
    const graphics = scene.add.graphics();

    frames.forEach((frame, index) => {
      const offsetX = index * CHARACTER_FRAME_WIDTH;
      for (const pixel of frame.pixels) {
        graphics.fillStyle(pixel.color, pixel.alpha ?? 1);
        graphics.fillRect(offsetX + pixel.x, pixel.y, pixel.width, pixel.height);
      }
    });

    graphics.generateTexture(
      definition.key,
      CHARACTER_FRAME_WIDTH * frames.length,
      CHARACTER_FRAME_HEIGHT
    );
    graphics.destroy();

    const texture = scene.textures.get(definition.key);
    frames.forEach((_frame, index) => {
      texture.add(
        index,
        0,
        index * CHARACTER_FRAME_WIDTH,
        0,
        CHARACTER_FRAME_WIDTH,
        CHARACTER_FRAME_HEIGHT
      );
    });

    const animationDefinitions: Array<{
      name: 'idle' | 'walk' | 'action' | 'hurt' | 'sleep';
      frames: CharacterFrameState[];
      frameRate: number;
      repeat: number;
    }> = [
      { name: 'idle', frames: ['idle'], frameRate: 1, repeat: -1 },
      { name: 'walk', frames: ['walk-a', 'idle', 'walk-b', 'idle'], frameRate: 7, repeat: -1 },
      { name: 'action', frames: ['action', 'idle'], frameRate: 5, repeat: 0 },
      { name: 'hurt', frames: ['hurt', 'idle'], frameRate: 8, repeat: 0 },
      { name: 'sleep', frames: ['sleep'], frameRate: 1, repeat: -1 }
    ];

    for (const animation of animationDefinitions) {
      const key = getCharacterAnimationKey(definition.key, animation.name);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: animation.frames.map((state) => ({
          key: definition.key,
          frame: getCharacterFrameIndex(state)
        })),
        frameRate: animation.frameRate,
        repeat: animation.repeat
      });
    }
  }
};
