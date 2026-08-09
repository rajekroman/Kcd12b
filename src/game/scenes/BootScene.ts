import Phaser from 'phaser';
import { ATLAS_ASSET_MANIFEST } from '../../data/assetManifest';
import { createVillageStreetPresentation } from '../../presentation/VillageStreetRenderer';
import {
  assertStaticAtlasTextures,
  describeAtlasLoadFailure,
  getAtlasEntryByRuntimeKey,
  queueStaticAtlasPreloads
} from '../../systems/AtlasRuntimeLoader';
import { registerCharacterAtlases } from '../../systems/CharacterAtlasSystem';
import { registerFaunaAtlases } from '../../systems/FaunaAtlasSystem';
import { registerPortraitAtlases } from '../../systems/PortraitSystem';

const LEGACY_WORLD_TEXTURES = new Set(['grass', 'road', 'tree', 'house']);
const PRESENTATION_NPCS = [
  ['smith-bohdan', 314, 330],
  ['innkeeper-marta', 546, 336],
  ['guard-vojtech', 463, 307],
  ['farmer-ondra', 398, 286]
] as const;

export class BootScene extends Phaser.Scene {
  private atlasLoadFailure: string | undefined;

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleAtlasLoadError, this);
    queueStaticAtlasPreloads(this.load);
  }

  create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleAtlasLoadError, this);
    if (this.atlasLoadFailure) throw new Error(this.atlasLoadFailure);
    assertStaticAtlasTextures(this.textures);
    registerCharacterAtlases(this);
    registerPortraitAtlases(this);
    registerFaunaAtlases(this);
    this.createGroundTexture('grass', 0x4b5b37, 0x38452d);
    this.createGroundTexture('road', 0x75664f, 0x594c3c);
    this.createObstacleTexture('tree', 0x2f3e27, 0x5b3f28);
    this.createObstacleTexture('house', 0x755039, 0x3b2b25, 32, 28);
    this.installVisualRebootPresentation();
    document.body.dataset.characterAtlases = '12';
    document.body.dataset.atlasAssetSource = 'static-file';
    document.body.dataset.atlasAssetsLoaded = String(ATLAS_ASSET_MANIFEST.length);
    this.scene.start('MenuScene');
  }

  private installVisualRebootPresentation(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on(Phaser.Scenes.Events.CREATE, () => {
      const blockers = gameScene.physics.add.staticGroup();
      const presentation = createVillageStreetPresentation(gameScene, blockers);

      gameScene.children.list.forEach((gameObject) => {
        if (gameObject instanceof Phaser.GameObjects.Image) {
          if (LEGACY_WORLD_TEXTURES.has(gameObject.texture.key)) gameObject.setVisible(false);
          return;
        }
        if (gameObject instanceof Phaser.GameObjects.Text) {
          gameObject.setVisible(false);
        }
      });

      const characterSprites = gameScene.children.list.filter(
        (gameObject): gameObject is Phaser.GameObjects.Sprite =>
          gameObject instanceof Phaser.GameObjects.Sprite
      );
      characterSprites.forEach((sprite) => sprite.setScale(2).setDepth(16));

      const player = characterSprites.find((sprite) => sprite.texture.key === 'player');
      if (player) {
        player.setPosition(400, 338).setDepth(18);
        const body = (player as Phaser.Physics.Arcade.Sprite).body;
        body?.setSize(12, 12).setOffset(4, 17);
      }

      PRESENTATION_NPCS.forEach(([textureKey, x, y], index) => {
        if (!gameScene.textures.exists(textureKey)) return;
        gameScene.add
          .sprite(x, y, textureKey, 0)
          .setScale(2)
          .setDepth(14 + index)
          .setData('presentationOnly', true);
      });

      const camera = gameScene.cameras.main;
      camera.stopFollow();
      camera.setZoom(1);
      camera.setBounds(0, 0, presentation.worldWidth, presentation.worldHeight);
      camera.setScroll(160, 92);
      camera.roundPixels = true;

      document.body.dataset.cameraPresentation = 'fixed-scenic-checkpoint';
      document.body.dataset.playerPresentationScale = '2';
      document.body.dataset.presentationNpcCount = String(PRESENTATION_NPCS.length);
    });
  }

  private handleAtlasLoadError(file: Phaser.Loader.File): void {
    const entry = getAtlasEntryByRuntimeKey(file.key);
    if (!entry) return;
    this.atlasLoadFailure = describeAtlasLoadFailure(entry);
    document.body.dataset.atlasLoadError = this.atlasLoadFailure;
  }

  private createGroundTexture(key: string, base: number, detail: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(base).fillRect(0, 0, 16, 16);
    graphics.fillStyle(detail).fillRect(2, 3, 2, 1).fillRect(11, 8, 2, 1).fillRect(6, 13, 1, 1);
    graphics.generateTexture(key, 16, 16);
    graphics.destroy();
  }

  private createObstacleTexture(
    key: string,
    primary: number,
    secondary: number,
    width = 20,
    height = 30
  ): void {
    const graphics = this.add.graphics();
    if (key === 'tree') {
      graphics.fillStyle(secondary).fillRect(8, 18, 4, 12);
      graphics.fillStyle(primary).fillCircle(10, 12, 10);
    } else {
      graphics.fillStyle(primary).fillRect(0, 8, width, height - 8);
      graphics.fillStyle(secondary).fillTriangle(0, 8, width / 2, 0, width, 8);
      graphics.fillStyle(0x1a1512).fillRect(width / 2 - 3, height - 10, 6, 10);
    }
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
