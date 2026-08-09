import Phaser from 'phaser';

export interface VillageStreetPresentation {
  readonly worldWidth: number;
  readonly worldHeight: number;
}

const SKY = 0x91b8c8;
const SKY_HAZE = 0xd9c9a1;
const FAR_HILL = 0x637b59;
const MID_HILL = 0x435f43;
const TREE_DARK = 0x253d2b;
const TREE_MID = 0x365635;
const TREE_LIGHT = 0x59714a;
const PLASTER = 0xb8a67f;
const PLASTER_LIGHT = 0xd1c19a;
const TIMBER = 0x4c3426;
const TIMBER_DARK = 0x2a211b;
const ROOF_DARK = 0x55392d;
const ROOF_MID = 0x76503a;
const ROOF_LIGHT = 0x9a704b;
const ROAD = 0x8b7655;
const ROAD_DARK = 0x67553e;
const ROAD_LIGHT = 0xb39a6b;
const GRASS = 0x657048;
const GRASS_DARK = 0x47563b;
const GRASS_LIGHT = 0x7f8555;
const STONE = 0x736d5d;
const STONE_LIGHT = 0x97907a;

const px = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 1
): void => {
  graphics.fillStyle(color, alpha);
  graphics.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

const poly = (
  graphics: Phaser.GameObjects.Graphics,
  points: Array<[number, number]>,
  color: number,
  alpha = 1
): void => {
  graphics.fillStyle(color, alpha);
  graphics.fillPoints(points.map(([x, y]) => new Phaser.Geom.Point(Math.round(x), Math.round(y))), true);
};

const drawTreeCluster = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number
): void => {
  px(graphics, x - 2 * scale, y + 10 * scale, 4 * scale, 13 * scale, 0x4b3526);
  const blocks: Array<[number, number, number, number, number]> = [
    [-10, 3, 13, 9, TREE_DARK],
    [-3, -4, 14, 10, TREE_DARK],
    [3, 1, 12, 10, TREE_MID],
    [-8, -7, 11, 9, TREE_MID],
    [0, -11, 10, 8, TREE_LIGHT],
    [7, -5, 7, 6, TREE_LIGHT]
  ];
  blocks.forEach(([dx, dy, w, h, color]) =>
    px(graphics, x + dx * scale, y + dy * scale, w * scale, h * scale, color)
  );
};

const drawRoofTexture = (
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  rows: number
): void => {
  for (let row = 0; row < rows; row += 1) {
    const y = top + row * 4;
    const inset = Math.max(0, Math.floor((rows - row) * 1.8));
    const usable = Math.max(4, width - inset * 2);
    for (let x = left + inset; x < left + inset + usable; x += 7) {
      px(graphics, x, y, 5, 2, row % 2 === 0 ? ROOF_LIGHT : ROOF_MID, 0.72);
      px(graphics, x + 1, y + 2, 4, 1, ROOF_DARK, 0.75);
    }
  }
};

const drawTimberFacade = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  roofPeak: number,
  doorX: number
): void => {
  px(graphics, x, y, width, height, PLASTER);
  px(graphics, x + 2, y + 2, width - 4, height - 4, PLASTER_LIGHT, 0.35);
  px(graphics, x, y, 4, height, TIMBER_DARK);
  px(graphics, x + width - 4, y, 4, height, TIMBER_DARK);
  px(graphics, x, y + 12, width, 4, TIMBER);
  px(graphics, x, y + height - 5, width, 5, TIMBER_DARK);
  for (let beam = x + 18; beam < x + width - 8; beam += 22) {
    px(graphics, beam, y + 2, 3, height - 7, TIMBER);
  }
  for (let beam = x + 8; beam < x + width - 8; beam += 30) {
    poly(graphics, [
      [beam, y + 16],
      [beam + 4, y + 16],
      [beam + 22, y + height - 5],
      [beam + 17, y + height - 5]
    ], TIMBER, 0.9);
  }
  px(graphics, doorX, y + height - 25, 15, 25, 0x3b2a21);
  px(graphics, doorX + 3, y + height - 22, 9, 18, 0x62432e);
  px(graphics, doorX + 10, y + height - 13, 2, 2, 0xc39c54);
  const windows = [x + 12, x + width - 28];
  windows.forEach((windowX) => {
    px(graphics, windowX, y + 21, 13, 12, TIMBER_DARK);
    px(graphics, windowX + 2, y + 23, 9, 8, 0x8ba9a0);
    px(graphics, windowX + 6, y + 23, 1, 8, TIMBER_DARK);
    px(graphics, windowX + 2, y + 27, 9, 1, TIMBER_DARK);
  });
  poly(graphics, [
    [x - 7, y],
    [x + width / 2, roofPeak],
    [x + width + 8, y],
    [x + width - 1, y + 10],
    [x + 2, y + 10]
  ], ROOF_DARK);
  poly(graphics, [
    [x - 3, y],
    [x + width / 2, roofPeak + 4],
    [x + width + 4, y],
    [x + width - 2, y + 5],
    [x + 3, y + 5]
  ], ROOF_MID);
  drawRoofTexture(graphics, x - 1, roofPeak + 8, width + 2, Math.max(4, Math.floor((y - roofPeak) / 4)));
};

const drawChurch = (graphics: Phaser.GameObjects.Graphics): void => {
  const x = 438;
  const baseY = 149;
  px(graphics, x, baseY - 35, 23, 35, 0xb9aa82);
  px(graphics, x + 4, baseY - 31, 15, 27, 0xd2c49d, 0.45);
  px(graphics, x + 9, baseY - 27, 5, 11, 0x3a352f);
  poly(graphics, [[x - 5, baseY - 35], [x + 12, baseY - 55], [x + 28, baseY - 35]], 0x4a4035);
  px(graphics, x + 10, baseY - 67, 4, 15, 0x40372f);
  px(graphics, x + 11, baseY - 73, 2, 7, 0x2c2925);
  px(graphics, x + 9, baseY - 70, 6, 1, 0x2c2925);
  px(graphics, x - 35, baseY - 17, 38, 17, 0xc3b18a);
  poly(graphics, [[x - 40, baseY - 17], [x - 17, baseY - 32], [x + 3, baseY - 17]], 0x71513a);
};

const drawCart = (graphics: Phaser.GameObjects.Graphics, x: number, y: number): void => {
  px(graphics, x, y, 35, 17, 0x68452f);
  px(graphics, x + 3, y + 3, 29, 9, 0x8b603b);
  px(graphics, x + 32, y + 12, 24, 3, 0x5d402c);
  [x + 7, x + 28].forEach((wheelX) => {
    graphics.lineStyle(3, 0x34271f, 1);
    graphics.strokeCircle(wheelX, y + 18, 8);
    graphics.lineStyle(1, 0x856348, 1);
    graphics.lineBetween(wheelX - 6, y + 18, wheelX + 6, y + 18);
    graphics.lineBetween(wheelX, y + 12, wheelX, y + 24);
  });
};

const drawFence = (
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  startY: number,
  length: number,
  rise: number
): void => {
  const segments = 8;
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = startX + length * t;
    const y = startY + rise * t;
    px(graphics, x, y - 9, 3, 16, 0x5f462f);
    if (index < segments) {
      const nextX = startX + length * ((index + 1) / segments);
      const nextY = startY + rise * ((index + 1) / segments);
      graphics.lineStyle(2, 0x74553a, 1);
      graphics.lineBetween(x, y - 4, nextX, nextY - 4);
      graphics.lineBetween(x, y + 2, nextX, nextY + 2);
    }
  }
};

const drawRoadTexture = (graphics: Phaser.GameObjects.Graphics): void => {
  const stones: Array<[number, number, number, number]> = [
    [221, 314, 8, 3], [247, 326, 4, 2], [279, 302, 7, 3], [312, 344, 9, 3],
    [354, 319, 5, 2], [394, 360, 8, 3], [428, 338, 5, 3], [456, 383, 9, 3],
    [500, 348, 7, 2], [534, 394, 5, 2], [572, 366, 10, 3], [616, 411, 8, 3],
    [670, 382, 6, 2], [705, 432, 8, 3], [752, 405, 5, 2], [808, 452, 9, 3]
  ];
  stones.forEach(([x, y, w, h], index) =>
    px(graphics, x, y, w, h, index % 2 === 0 ? STONE_LIGHT : STONE, 0.8)
  );

  graphics.lineStyle(3, ROAD_DARK, 0.42);
  graphics.beginPath();
  graphics.moveTo(335, 248);
  graphics.lineTo(300, 330);
  graphics.lineTo(258, 445);
  graphics.lineTo(214, 540);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(430, 248);
  graphics.lineTo(470, 330);
  graphics.lineTo(535, 445);
  graphics.lineTo(602, 540);
  graphics.strokePath();

  graphics.lineStyle(2, ROAD_LIGHT, 0.3);
  graphics.beginPath();
  graphics.moveTo(344, 250);
  graphics.lineTo(315, 334);
  graphics.lineTo(280, 442);
  graphics.strokePath();
};

export const createVillageStreetPresentation = (
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup
): VillageStreetPresentation => {
  const worldWidth = 960;
  const worldHeight = 540;

  const background = scene.add.graphics().setDepth(-40);
  px(background, 0, 0, worldWidth, 540, SKY);
  px(background, 0, 105, worldWidth, 120, SKY_HAZE, 0.45);

  poly(background, [[0, 190], [95, 128], [180, 166], [268, 112], [355, 155], [458, 104], [560, 157], [655, 118], [760, 166], [860, 120], [960, 158], [960, 255], [0, 255]], FAR_HILL);
  poly(background, [[0, 216], [82, 171], [170, 206], [250, 161], [335, 201], [430, 153], [525, 207], [615, 163], [700, 206], [805, 166], [900, 211], [960, 184], [960, 277], [0, 277]], MID_HILL);

  for (let x = 8; x < 950; x += 28) {
    const y = 202 + ((x * 13) % 23);
    drawTreeCluster(background, x, y, 0.55 + ((x % 5) * 0.04));
  }
  drawChurch(background);

  const ground = scene.add.graphics().setDepth(-20);
  px(ground, 0, 224, worldWidth, worldHeight - 224, GRASS);
  for (let x = 3; x < worldWidth; x += 13) {
    const y = 236 + ((x * 17) % 295);
    px(ground, x, y, 2 + (x % 3), 1, x % 4 === 0 ? GRASS_LIGHT : GRASS_DARK, 0.72);
  }

  poly(ground, [[348, 226], [431, 226], [738, 540], [145, 540]], ROAD_DARK);
  poly(ground, [[356, 227], [424, 227], [694, 540], [179, 540]], ROAD);
  poly(ground, [[370, 229], [411, 229], [601, 540], [252, 540]], ROAD_LIGHT, 0.18);
  drawRoadTexture(ground);

  const midground = scene.add.graphics().setDepth(-5);
  drawTimberFacade(midground, 36, 258, 205, 96, 205, 102);
  drawTimberFacade(midground, 588, 246, 238, 106, 188, 663);

  // Smithy lean-to and workshop frontage.
  px(midground, 34, 350, 220, 8, 0x403126);
  px(midground, 58, 358, 122, 42, 0x5b4935);
  poly(midground, [[48, 359], [133, 330], [190, 359]], 0x49392d);
  px(midground, 83, 369, 41, 19, 0x241e19);
  px(midground, 91, 372, 25, 5, 0xb06d34, 0.55);
  px(midground, 145, 367, 27, 22, 0x372a21);
  px(midground, 149, 371, 19, 13, 0x5d4632);

  // Inn sign and hanging bracket.
  px(midground, 610, 288, 3, 27, TIMBER_DARK);
  px(midground, 611, 289, 25, 3, TIMBER_DARK);
  px(midground, 625, 292, 22, 23, 0x3b2d24);
  px(midground, 628, 295, 16, 17, 0x8f6d42);
  px(midground, 633, 299, 6, 10, 0xc4a15c);
  px(midground, 635, 297, 2, 3, 0xd8c687);

  drawFence(midground, 242, 350, 112, -22);
  drawFence(midground, 521, 337, 86, 17);
  drawFence(midground, 722, 363, 135, 28);
  drawCart(midground, 682, 380);

  // Stone wall fragments and clutter.
  for (let index = 0; index < 9; index += 1) {
    px(midground, 20 + index * 17, 414 + (index % 2) * 3, 15, 7, index % 3 === 0 ? STONE_LIGHT : STONE);
    px(midground, 738 + index * 18, 426 + (index % 3) * 2, 16, 7, index % 2 === 0 ? STONE : STONE_LIGHT);
  }

  [
    [19, 337, 1.35], [263, 285, 1.05], [540, 278, 0.95], [852, 300, 1.2],
    [42, 457, 1.5], [874, 454, 1.4], [789, 231, 0.75]
  ].forEach(([x, y, scale]) => drawTreeCluster(midground, x, y, scale));

  // Foreground vegetation frames the road and creates depth.
  const foreground = scene.add.graphics().setDepth(35);
  for (let x = 0; x < 960; x += 19) {
    if (x > 165 && x < 725) continue;
    const h = 6 + ((x * 7) % 15);
    px(foreground, x, 520 - h, 3, h, GRASS_DARK, 0.9);
    px(foreground, x + 3, 522 - h * 0.7, 2, h * 0.7, GRASS_LIGHT, 0.9);
  }

  // Invisible collision silhouettes: visual geometry remains authored above.
  const invisibleObstacle = (x: number, y: number, width: number, height: number): void => {
    const blocker = obstacles.create(x, y, undefined) as Phaser.Physics.Arcade.Image;
    blocker.setVisible(false).setSize(width, height);
    blocker.body?.setSize(width, height);
  };
  invisibleObstacle(139, 309, 210, 92);
  invisibleObstacle(707, 301, 242, 104);
  invisibleObstacle(109, 376, 136, 45);

  document.body.dataset.visualReboot = 'village-street-checkpoint';
  document.body.dataset.worldPresentation = 'authored-3q-scenic';
  document.body.dataset.legacyWorldPlaceholders = 'false';
  document.body.dataset.presentationLayers = '4';

  return { worldWidth, worldHeight };
};
