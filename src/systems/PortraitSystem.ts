import type Phaser from 'phaser';
import {
  getCharacterAtlasDefinition,
  type CharacterPalette,
  type Headwear
} from '../data/characterAtlases';
import {
  PORTRAIT_DEFINITIONS,
  PORTRAIT_EXPRESSIONS,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  getPortraitFrameIndex,
  getPortraitTextureKey,
  type FaceShape,
  type PortraitDefinition,
  type PortraitExpression,
  type PortraitMark
} from '../data/portraits';

export interface PortraitPixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha?: number;
}

export interface PortraitFrameModel {
  expression: PortraitExpression;
  pixels: PortraitPixelRect[];
}

interface ExpressionGeometry {
  browLeftY: number;
  browRightY: number;
  eyeHeight: number;
  pupilShiftX: number;
  mouthY: number;
  mouthWidth: number;
  mouthCurve: -1 | 0 | 1;
  cheekAlpha: number;
}

const EXPRESSION_GEOMETRY: Record<PortraitExpression, ExpressionGeometry> = {
  neutral: {
    browLeftY: 20,
    browRightY: 20,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 34,
    mouthWidth: 8,
    mouthCurve: 0,
    cheekAlpha: 0.08
  },
  warm: {
    browLeftY: 20,
    browRightY: 20,
    eyeHeight: 1,
    pupilShiftX: 0,
    mouthY: 33,
    mouthWidth: 10,
    mouthCurve: 1,
    cheekAlpha: 0.28
  },
  stern: {
    browLeftY: 19,
    browRightY: 19,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 35,
    mouthWidth: 10,
    mouthCurve: -1,
    cheekAlpha: 0.05
  },
  concerned: {
    browLeftY: 18,
    browRightY: 19,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 35,
    mouthWidth: 7,
    mouthCurve: -1,
    cheekAlpha: 0.12
  },
  suspicious: {
    browLeftY: 18,
    browRightY: 21,
    eyeHeight: 1,
    pupilShiftX: 1,
    mouthY: 35,
    mouthWidth: 7,
    mouthCurve: 0,
    cheekAlpha: 0.04
  },
  proud: {
    browLeftY: 19,
    browRightY: 19,
    eyeHeight: 1,
    pupilShiftX: 0,
    mouthY: 33,
    mouthWidth: 8,
    mouthCurve: 1,
    cheekAlpha: 0.16
  }
};

const rect = (
  pixels: PortraitPixelRect[],
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

const faceBounds = (shape: FaceShape): { x: number; y: number; width: number; height: number } => {
  switch (shape) {
    case 'round':
      return { x: 12, y: 12, width: 24, height: 31 };
    case 'square':
      return { x: 11, y: 11, width: 26, height: 32 };
    case 'narrow':
      return { x: 14, y: 10, width: 20, height: 34 };
    case 'broad':
      return { x: 10, y: 11, width: 28, height: 32 };
  }
};

const drawBackdrop = (
  pixels: PortraitPixelRect[],
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  rect(pixels, 0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, 0x120f0c);
  rect(pixels, 2, 2, PORTRAIT_WIDTH - 4, PORTRAIT_HEIGHT - 4, definition.background);
  rect(pixels, 4, 4, PORTRAIT_WIDTH - 8, 3, definition.backgroundAccent, 0.72);
  rect(pixels, 4, PORTRAIT_HEIGHT - 7, PORTRAIT_WIDTH - 8, 3, definition.backgroundAccent, 0.48);
  rect(pixels, 4, 7, 3, PORTRAIT_HEIGHT - 14, definition.backgroundAccent, 0.28);
  rect(pixels, PORTRAIT_WIDTH - 7, 7, 3, PORTRAIT_HEIGHT - 14, definition.backgroundAccent, 0.28);

  if (expression === 'stern' || expression === 'suspicious') {
    rect(pixels, 7, 8, PORTRAIT_WIDTH - 14, 10, 0x090807, 0.18);
  }
  if (expression === 'warm' || expression === 'proud') {
    rect(pixels, 8, PORTRAIT_HEIGHT - 17, PORTRAIT_WIDTH - 16, 8, definition.backgroundAccent, 0.13);
  }
};

const drawShoulders = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition
): void => {
  const broad = definition.faceShape === 'broad' || definition.faceShape === 'square';
  const x = broad ? 5 : 7;
  const width = broad ? 38 : 34;
  rect(pixels, x, 43, width, 11, palette.outline);
  rect(pixels, x + 2, 44, width - 4, 10, palette.primaryShadow);
  rect(pixels, x + 5, 45, width - 10, 9, palette.primary);
  rect(pixels, 21, 43, 6, 11, palette.secondaryShadow);
  rect(pixels, 22, 43, 4, 9, palette.secondary);
};

const drawHairBehindFace = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  bounds: ReturnType<typeof faceBounds>
): void => {
  if (definition.longHair) {
    rect(pixels, bounds.x - 3, bounds.y + 4, 4, bounds.height + 7, palette.hair);
    rect(pixels, bounds.x + bounds.width - 1, bounds.y + 4, 4, bounds.height + 7, palette.hair);
    rect(pixels, bounds.x, bounds.y - 2, bounds.width, 6, palette.hair);
  } else {
    rect(pixels, bounds.x - 1, bounds.y - 1, bounds.width + 2, 6, palette.hair);
    rect(pixels, bounds.x - 2, bounds.y + 3, 4, 11, palette.hair);
    rect(pixels, bounds.x + bounds.width - 2, bounds.y + 3, 4, 9, palette.hair);
  }
};

const drawFace = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  const bounds = faceBounds(definition.faceShape);
  const geometry = EXPRESSION_GEOMETRY[expression];
  drawHairBehindFace(pixels, palette, definition, bounds);

  rect(pixels, bounds.x, bounds.y + 3, bounds.width, bounds.height - 7, palette.outline);
  rect(pixels, bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 5, palette.skinShadow);
  rect(pixels, bounds.x + 3, bounds.y + 1, bounds.width - 6, bounds.height - 7, palette.skin);
  rect(pixels, bounds.x + 4, bounds.y + 4, 4, 15, 0xf1c69d, 0.22);
  rect(pixels, bounds.x + bounds.width - 7, bounds.y + 8, 3, 14, 0x6d4435, 0.16);

  const leftEyeX = 17;
  const rightEyeX = 29;
  rect(pixels, leftEyeX - 2, geometry.browLeftY, 7, 2, palette.hair);
  rect(pixels, rightEyeX - 2, geometry.browRightY, 7, 2, palette.hair);
  if (expression === 'stern') {
    rect(pixels, leftEyeX + 3, geometry.browLeftY - 1, 2, 1, palette.hair);
    rect(pixels, rightEyeX - 2, geometry.browRightY - 1, 2, 1, palette.hair);
  }
  if (expression === 'concerned') {
    rect(pixels, leftEyeX - 2, geometry.browLeftY + 2, 2, 1, palette.hair);
    rect(pixels, rightEyeX + 3, geometry.browRightY + 2, 2, 1, palette.hair);
  }

  rect(pixels, leftEyeX - 1, 24, 6, geometry.eyeHeight, 0xe8ded0);
  rect(pixels, rightEyeX - 1, 24, 6, geometry.eyeHeight, 0xe8ded0);
  rect(pixels, leftEyeX + 1 + geometry.pupilShiftX, 24, 2, geometry.eyeHeight, definition.eyeColor);
  rect(pixels, rightEyeX + 1 + geometry.pupilShiftX, 24, 2, geometry.eyeHeight, definition.eyeColor);
  rect(pixels, leftEyeX + 1 + geometry.pupilShiftX, 24, 1, geometry.eyeHeight, palette.outline);
  rect(pixels, rightEyeX + 1 + geometry.pupilShiftX, 24, 1, geometry.eyeHeight, palette.outline);

  rect(pixels, 23, 25, 3, 7, palette.skinShadow);
  rect(pixels, 24, 25, 2, 5, palette.skin);
  rect(pixels, 22, 31, 5, 2, palette.skinShadow);

  rect(pixels, 14, 29, 5, 3, 0xb34b45, geometry.cheekAlpha);
  rect(pixels, 30, 29, 5, 3, 0xb34b45, geometry.cheekAlpha);
  drawMouth(pixels, palette, geometry);
  drawFacialHair(pixels, palette, definition, expression);
  drawMarks(pixels, palette, definition.mark, definition.ageLines ?? false);
};

const drawMouth = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  geometry: ExpressionGeometry
): void => {
  const x = Math.round((PORTRAIT_WIDTH - geometry.mouthWidth) / 2);
  if (geometry.mouthCurve === 0) {
    rect(pixels, x, geometry.mouthY, geometry.mouthWidth, 2, palette.outline);
    rect(pixels, x + 2, geometry.mouthY, geometry.mouthWidth - 4, 1, 0x7d3d38);
    return;
  }

  if (geometry.mouthCurve > 0) {
    rect(pixels, x, geometry.mouthY, 2, 1, palette.outline);
    rect(pixels, x + 2, geometry.mouthY + 1, geometry.mouthWidth - 4, 2, palette.outline);
    rect(pixels, x + geometry.mouthWidth - 2, geometry.mouthY, 2, 1, palette.outline);
    rect(pixels, x + 3, geometry.mouthY + 1, geometry.mouthWidth - 6, 1, 0xb66a5d);
    return;
  }

  rect(pixels, x, geometry.mouthY + 2, 2, 1, palette.outline);
  rect(pixels, x + 2, geometry.mouthY, geometry.mouthWidth - 4, 2, palette.outline);
  rect(pixels, x + geometry.mouthWidth - 2, geometry.mouthY + 2, 2, 1, palette.outline);
};

const drawFacialHair = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  if (definition.moustache) {
    rect(pixels, 19, 32, 5, 2, palette.hair);
    rect(pixels, 24, 32, 5, 2, palette.hair);
    rect(pixels, 17, 33, 3, 1, palette.hair);
    rect(pixels, 29, 33, 3, 1, palette.hair);
  }
  if (definition.beard) {
    rect(pixels, 14, 35, 20, 7, palette.hair, 0.92);
    rect(pixels, 17, 41, 14, 4, palette.hair);
    rect(pixels, 20, 35, 8, expression === 'proud' ? 3 : 2, 0x8d5d45, 0.42);
  }
};

const drawMarks = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  mark: PortraitMark,
  ageLines: boolean
): void => {
  if (ageLines) {
    rect(pixels, 13, 27, 4, 1, palette.skinShadow, 0.7);
    rect(pixels, 32, 27, 4, 1, palette.skinShadow, 0.7);
    rect(pixels, 18, 38, 3, 1, palette.skinShadow, 0.5);
    rect(pixels, 28, 38, 3, 1, palette.skinShadow, 0.5);
  }

  switch (mark) {
    case 'none':
      break;
    case 'scar':
      rect(pixels, 33, 18, 1, 7, 0x7e3d35, 0.8);
      rect(pixels, 34, 20, 1, 5, 0xb86e5c, 0.45);
      break;
    case 'freckles':
      rect(pixels, 15, 29, 1, 1, 0x8f6146);
      rect(pixels, 18, 30, 1, 1, 0x8f6146);
      rect(pixels, 32, 29, 1, 1, 0x8f6146);
      rect(pixels, 35, 30, 1, 1, 0x8f6146);
      break;
    case 'wrinkles':
      rect(pixels, 18, 16, 12, 1, palette.skinShadow, 0.55);
      rect(pixels, 20, 18, 8, 1, palette.skinShadow, 0.38);
      break;
    case 'flour':
      rect(pixels, 12, 17, 4, 3, 0xe5ddca, 0.62);
      rect(pixels, 33, 30, 3, 2, 0xe5ddca, 0.5);
      rect(pixels, 16, 38, 2, 2, 0xe5ddca, 0.42);
      break;
    case 'dirt':
      rect(pixels, 12, 31, 5, 2, 0x5b3b2a, 0.42);
      rect(pixels, 31, 17, 4, 2, 0x5b3b2a, 0.38);
      rect(pixels, 28, 38, 4, 2, 0x5b3b2a, 0.35);
      break;
  }
};

const drawHeadwear = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  headwear: Headwear
): void => {
  switch (headwear) {
    case 'none':
      break;
    case 'hood':
      rect(pixels, 8, 5, 32, 8, palette.primaryShadow);
      rect(pixels, 6, 11, 8, 31, palette.primaryShadow);
      rect(pixels, 34, 11, 8, 31, palette.primaryShadow);
      rect(pixels, 10, 7, 28, 5, palette.primary);
      break;
    case 'cap':
      rect(pixels, 11, 5, 27, 6, palette.secondaryShadow);
      rect(pixels, 9, 10, 31, 4, palette.secondary);
      rect(pixels, 34, 7, 8, 3, palette.secondaryShadow);
      break;
    case 'helmet':
      rect(pixels, 10, 4, 28, 5, palette.metal);
      rect(pixels, 8, 8, 32, 8, palette.metal);
      rect(pixels, 8, 15, 5, 12, palette.primaryShadow);
      rect(pixels, 35, 15, 5, 12, palette.primaryShadow);
      rect(pixels, 22, 1, 5, 6, palette.accent);
      rect(pixels, 12, 10, 24, 2, 0xe6eceb, 0.28);
      break;
    case 'straw-hat':
      rect(pixels, 5, 8, 38, 5, palette.accent);
      rect(pixels, 12, 2, 24, 8, palette.secondary);
      rect(pixels, 15, 4, 18, 3, palette.secondaryShadow);
      break;
    case 'veil':
      rect(pixels, 10, 4, 28, 8, palette.accent);
      rect(pixels, 7, 11, 8, 34, palette.accent);
      rect(pixels, 33, 11, 8, 34, palette.accent);
      rect(pixels, 13, 6, 22, 4, 0xefe4c8, 0.25);
      break;
    case 'cowl':
      rect(pixels, 7, 4, 34, 10, palette.primaryShadow);
      rect(pixels, 5, 12, 10, 34, palette.primaryShadow);
      rect(pixels, 33, 12, 10, 34, palette.primaryShadow);
      rect(pixels, 10, 7, 28, 5, palette.primary);
      break;
    case 'headscarf':
      rect(pixels, 10, 4, 28, 8, palette.accent);
      rect(pixels, 7, 11, 9, 22, palette.accent);
      rect(pixels, 32, 11, 9, 24, palette.accent);
      rect(pixels, 36, 30, 6, 16, palette.accent);
      break;
  }
};

export const buildPortraitFrame = (
  definition: PortraitDefinition,
  expression: PortraitExpression
): PortraitFrameModel => {
  const palette = getCharacterAtlasDefinition(definition.atlasKey).palette;
  const pixels: PortraitPixelRect[] = [];
  drawBackdrop(pixels, definition, expression);
  drawShoulders(pixels, palette, definition);
  drawFace(pixels, palette, definition, expression);
  drawHeadwear(pixels, palette, definition.headwear);
  return { expression, pixels };
};

export const buildPortraitAtlas = (definition: PortraitDefinition): PortraitFrameModel[] =>
  PORTRAIT_EXPRESSIONS.map((expression) => buildPortraitFrame(definition, expression));

export const validatePortraitFrame = (frame: PortraitFrameModel): string[] => {
  const errors: string[] = [];
  if (frame.pixels.length < 20) errors.push(`${frame.expression}: portrait is too sparse`);
  for (const pixel of frame.pixels) {
    if (
      !Number.isInteger(pixel.x) ||
      !Number.isInteger(pixel.y) ||
      !Number.isInteger(pixel.width) ||
      !Number.isInteger(pixel.height)
    ) {
      errors.push(`${frame.expression}: non-integer portrait rectangle`);
    }
    if (
      pixel.x < 0 ||
      pixel.y < 0 ||
      pixel.x + pixel.width > PORTRAIT_WIDTH ||
      pixel.y + pixel.height > PORTRAIT_HEIGHT
    ) {
      errors.push(`${frame.expression}: rectangle outside ${PORTRAIT_WIDTH}x${PORTRAIT_HEIGHT}`);
    }
  }
  return errors;
};

export const registerPortraitAtlases = (scene: Phaser.Scene): void => {
  for (const definition of PORTRAIT_DEFINITIONS) {
    const key = getPortraitTextureKey(definition.npcId);
    if (scene.textures.exists(key)) continue;
    const frames = buildPortraitAtlas(definition);
    const graphics = scene.add.graphics();

    frames.forEach((frame, index) => {
      const offsetX = index * PORTRAIT_WIDTH;
      for (const pixel of frame.pixels) {
        graphics.fillStyle(pixel.color, pixel.alpha ?? 1);
        graphics.fillRect(offsetX + pixel.x, pixel.y, pixel.width, pixel.height);
      }
    });

    graphics.generateTexture(key, PORTRAIT_WIDTH * frames.length, PORTRAIT_HEIGHT);
    graphics.destroy();

    const texture = scene.textures.get(key);
    frames.forEach((_frame, index) => {
      texture.add(
        index,
        0,
        index * PORTRAIT_WIDTH,
        0,
        PORTRAIT_WIDTH,
        PORTRAIT_HEIGHT
      );
    });
  }

  document.body.dataset.portraitAtlases = String(PORTRAIT_DEFINITIONS.length);
  document.body.dataset.portraitExpressions = String(PORTRAIT_EXPRESSIONS.length);
};
