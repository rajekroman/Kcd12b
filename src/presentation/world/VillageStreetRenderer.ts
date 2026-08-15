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

const installPlayerPresentationProxy = (scene: Phaser.Scene): void => {
  const logicalPlayer = scene.children.list.find(
    (gameObject): gameObject is Phaser.Physics.Arcade.Sprite =>
      gameObject instanceof Phaser.Physics.Arcade.Sprite && gameObject.texture.key === 'player'
  );
  if (!logicalPlayer) return;

  const logicalOrigin = new Phaser.Math.Vector2(logicalPlayer.x, logicalPlayer.y);
  const presentationAnchor = new Phaser.Math.Vector2(480, 405);

  scene.time.delayedCall(0, () => {
    if (!logicalPlayer.active || !scene.sys.isActive()) return;

    const proxy = scene.add
      .sprite(presentationAnchor.x, presentationAnchor.y, logicalPlayer.texture.key, logicalPlayer.frame.name)
      .setScale(3.1)
      .setDepth(18)
      .setData('presentationOnly', true)
      .setData('presentationRole', 'player-proxy');

    logicalPlayer
      .setPosition(logicalOrigin.x, logicalOrigin.y)
      .setScale(1)
      .setVisible(false);
    logicalPlayer.body?.setSize(12, 12).setOffset(2, 8);

    const syncProxy = (): void => {
      if (!logicalPlayer.active || !proxy.active) return;
      proxy
        .setPosition(
          presentationAnchor.x + (logicalPlayer.x - logicalOrigin.x),
          presentationAnchor.y + (logicalPlayer.y - logicalOrigin.y)
        )
        .setFrame(logicalPlayer.frame.name)
        .setFlipX(logicalPlayer.flipX)
        .setFlipY(logicalPlayer.flipY);
    };

    scene.events.on(Phaser.Scenes.Events.UPDATE, syncProxy);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, syncProxy);
      proxy.destroy();
    });

    syncProxy();
    document.body.dataset.playerPresentationProxy = 'decoupled';
  });
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
  installPlayerPresentationProxy(scene);

  scene.data.set('visualReboot', 'authored-village-street');
  scene.data.set('presentationLayers', 4);
  document.body.dataset.visualReboot = 'village-street-authored-assets';
  document.body.dataset.worldPresentation = 'authored-pixel-art';
  document.body.dataset.legacyWorldPlaceholders = 'false';
  document.body.dataset.presentationLayers = '4';

  return { worldWidth, worldHeight, dayImage, eveningImage };
};
