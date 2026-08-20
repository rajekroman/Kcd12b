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

const installCharacterPresentationProxies = (scene: Phaser.Scene): void => {
  const logicalCharacters = scene.children.list.filter(
    (gameObject): gameObject is Phaser.Physics.Arcade.Sprite =>
      gameObject instanceof Phaser.Physics.Arcade.Sprite &&
      (gameObject.texture.key === 'player' || Boolean(gameObject.getData('npcId')))
  );
  const logicalPlayer = logicalCharacters.find((sprite) => sprite.texture.key === 'player');
  if (!logicalPlayer) return;

  const scaleX = 0.8;
  const scaleY = 0.675;
  const presentationAnchor = new Phaser.Math.Vector2(480, 405);
  const offsetX = presentationAnchor.x - logicalPlayer.x * scaleX;
  const offsetY = presentationAnchor.y - logicalPlayer.y * scaleY;
  const project = (sprite: Phaser.Physics.Arcade.Sprite): Phaser.Math.Vector2 =>
    new Phaser.Math.Vector2(sprite.x * scaleX + offsetX, sprite.y * scaleY + offsetY);

  scene.time.delayedCall(0, () => {
    if (!logicalPlayer.active || !scene.sys.isActive()) return;

    const proxies = logicalCharacters.map((logical) => {
      const position = project(logical);
      const npcId = logical.getData('npcId') as string | undefined;
      const proxy = scene.add
        .sprite(position.x, position.y, logical.texture.key, logical.frame.name)
        .setScale(3.1)
        .setDepth(logical === logicalPlayer ? 18 : 14 + position.y / 1000)
        .setData('presentationOnly', true)
        .setData('presentationRole', logical === logicalPlayer ? 'player-proxy' : 'npc-proxy');
      if (npcId) proxy.setData('npcId', npcId);

      logical.setScale(1).setVisible(false);
      return { logical, proxy };
    });

    const syncProxies = (): void => {
      proxies.forEach(({ logical, proxy }) => {
        if (!logical.active || !proxy.active) return;
        const position = project(logical);
        proxy
          .setPosition(position.x, position.y)
          .setFrame(logical.frame.name)
          .setFlipX(logical.flipX)
          .setFlipY(logical.flipY)
          .setDepth(logical === logicalPlayer ? 18 : 14 + position.y / 1000);
      });
    };

    scene.events.on(Phaser.Scenes.Events.UPDATE, syncProxies);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, syncProxies);
      proxies.forEach(({ proxy }) => proxy.destroy());
    });

    syncProxies();
    document.body.dataset.playerPresentationProxy = 'decoupled';
    document.body.dataset.presentationNpcCount = String(
      proxies.filter(({ logical }) => Boolean(logical.getData('npcId'))).length
    );
    document.body.dataset.characterProjection = 'authoritative-affine';
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
  installCharacterPresentationProxies(scene);

  scene.data.set('visualReboot', 'authored-village-street');
  scene.data.set('presentationLayers', 4);
  document.body.dataset.visualReboot = 'village-street-authored-assets';
  document.body.dataset.worldPresentation = 'authored-pixel-art';
  document.body.dataset.legacyWorldPlaceholders = 'false';
  document.body.dataset.presentationLayers = '4';

  return { worldWidth, worldHeight, dayImage, eveningImage };
};
