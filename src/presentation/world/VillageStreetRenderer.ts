import Phaser from 'phaser';

export interface VillageStreetPresentation {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly dayImage: Phaser.GameObjects.Image;
  readonly eveningImage: Phaser.GameObjects.Image;
}

const createObstacle = (
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  const blocker = obstacles.create(x, y, undefined) as Phaser.Physics.Arcade.Image;
  blocker.setVisible(false).setSize(width, height);
  blocker.body?.setSize(width, height);
};

export const createVillageStreetPresentation = (
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup
): VillageStreetPresentation => {
  const worldWidth = 960;
  const worldHeight = 540;
  scene.textures.get('village-street-authored-day')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.textures.get('village-street-evening')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const eveningImage = scene.add
    .image(worldWidth / 2, worldHeight / 2, 'village-street-evening')
    .setOrigin(0.5)
    .setDepth(-40)
    .setVisible(false);
  const dayImage = scene.add
    .image(worldWidth / 2, worldHeight / 2, 'village-street-authored-day')
    .setOrigin(0.5)
    .setDisplaySize(worldWidth, worldHeight)
    .setDepth(-40);

  // Collision silhouettes are invisible gameplay scaffolding, independent of art assets.
  createObstacle(obstacles, 120, 320, 150, 118);
  createObstacle(obstacles, 900, 278, 90, 92);

  scene.data.set('visualReboot', 'authored-village-street');
  scene.data.set('presentationLayers', 4);
  document.body.dataset.visualReboot = 'village-street-authored-assets';
  document.body.dataset.worldPresentation = 'authored-pixel-art';
  document.body.dataset.legacyWorldPlaceholders = 'false';
  document.body.dataset.presentationLayers = '4';

  return { worldWidth, worldHeight, dayImage, eveningImage };
};
