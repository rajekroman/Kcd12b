import Phaser from 'phaser';
import { registerCharacterAtlases } from '../../systems/CharacterAtlasSystem';
import { registerFaunaAtlases } from '../../systems/FaunaAtlasSystem';
import { registerPortraitAtlases } from '../../systems/PortraitSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    registerCharacterAtlases(this);
    registerPortraitAtlases(this);
    registerFaunaAtlases(this);
    this.createGroundTexture('grass', 0x4b5b37, 0x38452d);
    this.createGroundTexture('road', 0x75664f, 0x594c3c);
    this.createObstacleTexture('tree', 0x2f3e27, 0x5b3f28);
    this.createObstacleTexture('house', 0x755039, 0x3b2b25, 32, 28);
    document.body.dataset.characterAtlases = '12';
    this.scene.start('MenuScene');
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
