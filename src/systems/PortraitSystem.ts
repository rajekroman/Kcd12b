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
  leftBrowY: number;
  rightBrowY: number;
  eyeHeight: number;
  pupilShiftX: number;
  mouthY: number;
  mouthWidth: number;
  mouthCurve: -1 | 0 | 1;
  cheekAlpha: number;
}

const EXPRESSIONS: Record<PortraitExpression, ExpressionGeometry> = {
  neutral: {
    leftBrowY: 20,
    rightBrowY: 20,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 34,
    mouthWidth: 8,
    mouthCurve: 0,
    cheekAlpha: 0.08
  },
  warm: {
    leftBrowY: 20,
    rightBrowY: 20,
    eyeHeight: 1,
    pupilShiftX: 0,
    mouthY: 33,
    mouthWidth: 10,
    mouthCurve: 1,
    cheekAlpha: 0.28
  },
  stern: {
    leftBrowY: 19,
    rightBrowY: 19,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 35,
    mouthWidth: 10,
    mouthCurve: -1,
    cheekAlpha: 0.05
  },
  concerned: {
    leftBrowY: 18,
    rightBrowY: 19,
    eyeHeight: 2,
    pupilShiftX: 0,
    mouthY: 35,
    mouthWidth: 7,
    mouthCurve: -1,
    cheekAlpha: 0.12
  },
  suspicious: {
    leftBrowY: 18,
    rightBrowY: 21,
    eyeHeight: 1,
    pupilShiftX: 1,
    mouthY: 35,
    mouthWidth: 7,
    mouthCurve: 0,
    cheekAlpha: 0.04
  },
  proud: {
    leftBrowY: 19,
    rightBrowY: 19,
    eyeHeight: 1,
    pupilShiftX: 0,
    mouthY: 33,
    mouthWidth: 8,
    mouthCurve: 1,
    cheekAlpha: 0.16
  }
};

const addRect = (
  pixels: PortraitPixelRect[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 1
): void => {
  if (width > 0 && height > 0) pixels.push({ x, y, width, height, color, alpha });
};

const getFaceBounds = (
  shape: FaceShape
): { x: number; y: number; width: number; height: number } => {
  const bounds: Record<FaceShape, { x: number; y: number; width: number; height: number }> = {
    round: { x: 12, y: 12, width: 24, height: 31 },
    square: { x: 11, y: 11, width: 26, height: 32 },
    narrow: { x: 14, y: 10, width: 20, height: 34 },
    broad: { x: 10, y: 11, width: 28, height: 32 }
  };
  return bounds[shape];
};

const drawBackdrop = (
  pixels: PortraitPixelRect[],
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  addRect(pixels, 0, 0, 48, 56, 0x120f0c);
  addRect(pixels, 2, 2, 44, 52, definition.background);
  addRect(pixels, 4, 4, 40, 3, definition.backgroundAccent, 0.72);
  addRect(pixels, 4, 49, 40, 3, definition.backgroundAccent, 0.48);
  addRect(pixels, 4, 7, 3, 42, definition.backgroundAccent, 0.28);
  addRect(pixels, 41, 7, 3, 42, definition.backgroundAccent, 0.28);
  if (expression === 'stern' || expression === 'suspicious') {
    addRect(pixels, 7, 8, 34, 10, 0x090807, 0.18);
  }
  if (expression === 'warm' || expression === 'proud') {
    addRect(pixels, 8, 39, 32, 8, definition.backgroundAccent, 0.13);
  }
};

const drawShoulders = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  faceShape: FaceShape
): void => {
  const broad = faceShape === 'broad' || faceShape === 'square';
  const x = broad ? 5 : 7;
  const width = broad ? 38 : 34;
  addRect(pixels, x, 43, width, 11, palette.outline);
  addRect(pixels, x + 2, 44, width - 4, 10, palette.primaryShadow);
  addRect(pixels, x + 5, 45, width - 10, 9, palette.primary);
  addRect(pixels, 21, 43, 6, 11, palette.secondaryShadow);
  addRect(pixels, 22, 43, 4, 9, palette.secondary);
};

const drawHair = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  bounds: ReturnType<typeof getFaceBounds>
): void => {
  if (definition.longHair) {
    addRect(pixels, bounds.x - 3, bounds.y + 4, 4, Math.min(39, bounds.height + 7), palette.hair);
    addRect(
      pixels,
      bounds.x + bounds.width - 1,
      bounds.y + 4,
      4,
      Math.min(39, bounds.height + 7),
      palette.hair
    );
    addRect(pixels, bounds.x, bounds.y - 2, bounds.width, 6, palette.hair);
    return;
  }

  addRect(pixels, bounds.x - 1, bounds.y - 1, bounds.width + 2, 6, palette.hair);
  addRect(pixels, bounds.x - 2, bounds.y + 3, 4, 11, palette.hair);
  addRect(pixels, bounds.x + bounds.width - 2, bounds.y + 3, 4, 9, palette.hair);
};

const drawEyesAndBrows = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  eyeColor: number,
  expression: PortraitExpression
): void => {
  const geometry = EXPRESSIONS[expression];
  const leftEyeX = 17;
  const rightEyeX = 29;
  addRect(pixels, leftEyeX - 2, geometry.leftBrowY, 7, 2, palette.hair);
  addRect(pixels, rightEyeX - 2, geometry.rightBrowY, 7, 2, palette.hair);

  if (expression === 'stern') {
    addRect(pixels, leftEyeX + 3, geometry.leftBrowY - 1, 2, 1, palette.hair);
    addRect(pixels, rightEyeX - 2, geometry.rightBrowY - 1, 2, 1, palette.hair);
  }
  if (expression === 'concerned') {
    addRect(pixels, leftEyeX - 2, geometry.leftBrowY + 2, 2, 1, palette.hair);
    addRect(pixels, rightEyeX + 3, geometry.rightBrowY + 2, 2, 1, palette.hair);
  }

  for (const eyeX of [leftEyeX, rightEyeX]) {
    addRect(pixels, eyeX - 1, 24, 6, geometry.eyeHeight, 0xe8ded0);
    addRect(
      pixels,
      eyeX + 1 + geometry.pupilShiftX,
      24,
      2,
      geometry.eyeHeight,
      eyeColor
    );
    addRect(
      pixels,
      eyeX + 1 + geometry.pupilShiftX,
      24,
      1,
      geometry.eyeHeight,
      palette.outline
    );
  }
};

const drawMouth = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  expression: PortraitExpression
): void => {
  const geometry = EXPRESSIONS[expression];
  const x = Math.round((48 - geometry.mouthWidth) / 2);
  if (geometry.mouthCurve === 0) {
    addRect(pixels, x, geometry.mouthY, geometry.mouthWidth, 2, palette.outline);
    addRect(pixels, x + 2, geometry.mouthY, geometry.mouthWidth - 4, 1, 0x7d3d38);
    return;
  }
  if (geometry.mouthCurve > 0) {
    addRect(pixels, x, geometry.mouthY, 2, 1, palette.outline);
    addRect(pixels, x + 2, geometry.mouthY + 1, geometry.mouthWidth - 4, 2, palette.outline);
    addRect(pixels, x + geometry.mouthWidth - 2, geometry.mouthY, 2, 1, palette.outline);
    addRect(pixels, x + 3, geometry.mouthY + 1, geometry.mouthWidth - 6, 1, 0xb66a5d);
    return;
  }
  addRect(pixels, x, geometry.mouthY + 2, 2, 1, palette.outline);
  addRect(pixels, x + 2, geometry.mouthY, geometry.mouthWidth - 4, 2, palette.outline);
  addRect(pixels, x + geometry.mouthWidth - 2, geometry.mouthY + 2, 2, 1, palette.outline);
};

const drawFacialHair = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  if (definition.moustache) {
    addRect(pixels, 19, 32, 5, 2, palette.hair);
    addRect(pixels, 24, 32, 5, 2, palette.hair);
    addRect(pixels, 17, 33, 3, 1, palette.hair);
    addRect(pixels, 29, 33, 3, 1, palette.hair);
  }
  if (definition.beard) {
    addRect(pixels, 14, 35, 20, 7, palette.hair, 0.92);
    addRect(pixels, 17, 41, 14, 4, palette.hair);
    addRect(pixels, 20, 35, 8, expression === 'proud' ? 3 : 2, 0x8d5d45, 0.42);
  }
};

const drawMarks = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  mark: PortraitMark,
  ageLines: boolean
): void => {
  if (ageLines) {
    addRect(pixels, 13, 27, 4, 1, palette.skinShadow, 0.7);
    addRect(pixels, 32, 27, 4, 1, palette.skinShadow, 0.7);
    addRect(pixels, 18, 38, 3, 1, palette.skinShadow, 0.5);
    addRect(pixels, 28, 38, 3, 1, palette.skinShadow, 0.5);
  }

  switch (mark) {
    case 'none':
      return;
    case 'scar':
      addRect(pixels, 33, 18, 1, 7, 0x7e3d35, 0.8);
      addRect(pixels, 34, 20, 1, 5, 0xb86e5c, 0.45);
      return;
    case 'freckles':
      addRect(pixels, 15, 29, 1, 1, 0x8f6146);
      addRect(pixels, 18, 30, 1, 1, 0x8f6146);
      addRect(pixels, 32, 29, 1, 1, 0x8f6146);
      addRect(pixels, 35, 30, 1, 1, 0x8f6146);
      return;
    case 'wrinkles':
      addRect(pixels, 18, 16, 12, 1, palette.skinShadow, 0.55);
      addRect(pixels, 20, 18, 8, 1, palette.skinShadow, 0.38);
      return;
    case 'flour':
      addRect(pixels, 12, 17, 4, 3, 0xe5ddca, 0.62);
      addRect(pixels, 33, 30, 3, 2, 0xe5ddca, 0.5);
      addRect(pixels, 16, 38, 2, 2, 0xe5ddca, 0.42);
      return;
    case 'dirt':
      addRect(pixels, 12, 31, 5, 2, 0x5b3b2a, 0.42);
      addRect(pixels, 31, 17, 4, 2, 0x5b3b2a, 0.38);
      addRect(pixels, 28, 38, 4, 2, 0x5b3b2a, 0.35);
  }
};

const drawHeadwear = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  headwear: Headwear
): void => {
  switch (headwear) {
    case 'none':
      return;
    case 'hood':
      addRect(pixels, 8, 5, 32, 8, palette.primaryShadow);
      addRect(pixels, 6, 11, 8, 31, palette.primaryShadow);
      addRect(pixels, 34, 11, 8, 31, palette.primaryShadow);
      addRect(pixels, 10, 7, 28, 5, palette.primary);
      return;
    case 'cap':
      addRect(pixels, 11, 5, 27, 6, palette.secondaryShadow);
      addRect(pixels, 9, 10, 31, 4, palette.secondary);
      addRect(pixels, 34, 7, 8, 3, palette.secondaryShadow);
      return;
    case 'helmet':
      addRect(pixels, 10, 4, 28, 5, palette.metal);
      addRect(pixels, 8, 8, 32, 8, palette.metal);
      addRect(pixels, 8, 15, 5, 12, palette.primaryShadow);
      addRect(pixels, 35, 15, 5, 12, palette.primaryShadow);
      addRect(pixels, 22, 1, 5, 6, palette.accent);
      addRect(pixels, 12, 10, 24, 2, 0xe6eceb, 0.28);
      return;
    case 'straw-hat':
      addRect(pixels, 5, 8, 38, 5, palette.accent);
      addRect(pixels, 12, 2, 24, 8, palette.secondary);
      addRect(pixels, 15, 4, 18, 3, palette.secondaryShadow);
      return;
    case 'veil':
      addRect(pixels, 10, 4, 28, 8, palette.accent);
      addRect(pixels, 7, 11, 8, 34, palette.accent);
      addRect(pixels, 33, 11, 8, 34, palette.accent);
      addRect(pixels, 13, 6, 22, 4, 0xefe4c8, 0.25);
      return;
    case 'cowl':
      addRect(pixels, 7, 4, 34, 10, palette.primaryShadow);
      addRect(pixels, 5, 12, 10, 34, palette.primaryShadow);
      addRect(pixels, 33, 12, 10, 34, palette.primaryShadow);
      addRect(pixels, 10, 7, 28, 5, palette.primary);
      return;
    case 'headscarf':
      addRect(pixels, 10, 4, 28, 8, palette.accent);
      addRect(pixels, 7, 11, 9, 22, palette.accent);
      addRect(pixels, 32, 11, 9, 24, palette.accent);
      addRect(pixels, 36, 30, 6, 16, palette.accent);
  }
};

const drawFace = (
  pixels: PortraitPixelRect[],
  palette: CharacterPalette,
  definition: PortraitDefinition,
  expression: PortraitExpression
): void => {
  const bounds = getFaceBounds(definition.faceShape);
  const geometry = EXPRESSIONS[expression];
  drawHair(pixels, palette, definition, bounds);
  addRect(pixels, bounds.x, bounds.y + 3, bounds.width, bounds.height - 7, palette.outline);
  addRect(pixels, bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 5, palette.skinShadow);
  addRect(pixels, bounds.x + 3, bounds.y + 1, bounds.width - 6, bounds.height - 7, palette.skin);
  addRect(pixels, bounds.x + 4, bounds.y + 4, 4, 15, 0xf1c69d, 0.22);
  addRect(pixels, bounds.x + bounds.width - 7, bounds.y + 8, 3, 14, 0x6d4435, 0.16);
  drawEyesAndBrows(pixels, palette, definition.eyeColor, expression);
  addRect(pixels, 23, 25, 3, 7, palette.skinShadow);
  addRect(pixels, 24, 25, 2, 5, palette.skin);
  addRect(pixels, 22, 31, 5, 2, palette.skinShadow);
  addRect(pixels, 14, 29, 5, 3, 0xb34b45, geometry.cheekAlpha);
  addRect(pixels, 30, 29, 5, 3, 0xb34b45, geometry.cheekAlpha);
  drawMouth(pixels, palette, expression);
  drawFacialHair(pixels, palette, definition, expression);
  drawMarks(pixels, palette, definition.mark, definition.ageLines ?? false);
};

export const buildPortraitFrame = (
  definition: PortraitDefinition,
  expression: PortraitExpression
): PortraitFrameModel => {
  const palette = getCharacterAtlasDefinition(definition.atlasKey).palette;
  const pixels: PortraitPixelRect[] = [];
  drawBackdrop(pixels, definition, expression);
  drawShoulders(pixels, palette, definition.faceShape);
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

    for (const frame of frames) {
      const frameIndex = getPortraitFrameIndex(frame.expression);
      const offsetX = frameIndex * PORTRAIT_WIDTH;
      for (const pixel of frame.pixels) {
        graphics.fillStyle(pixel.color, pixel.alpha ?? 1);
        graphics.fillRect(offsetX + pixel.x, pixel.y, pixel.width, pixel.height);
      }
    }

    graphics.generateTexture(key, PORTRAIT_WIDTH * frames.length, PORTRAIT_HEIGHT);
    graphics.destroy();

    const texture = scene.textures.get(key);
    for (const frame of frames) {
      const frameIndex = getPortraitFrameIndex(frame.expression);
      texture.add(
        frameIndex,
        0,
        frameIndex * PORTRAIT_WIDTH,
        0,
        PORTRAIT_WIDTH,
        PORTRAIT_HEIGHT
      );
    }
  }

  document.body.dataset.portraitAtlases = String(PORTRAIT_DEFINITIONS.length);
  document.body.dataset.portraitExpressions = String(PORTRAIT_EXPRESSIONS.length);
};
