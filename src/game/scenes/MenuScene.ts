import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private sceneActive = false;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.sceneActive = true;
    this.saveSystem = SaveSystem.forBrowser(window.indexedDB, window.localStorage);
    document.body.classList.remove('game-active');
    document.body.dataset.scene = 'menu';
    document.body.dataset.menuReady = 'false';
    delete document.body.dataset.uiScene;
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.updateAccessibleStatus('Hlavní menu. Nová hra. Kontroluji uloženou pozici.');

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0a08');

    this.add
      .text(width / 2, height * 0.25, 'CHRONICLES\nOF BOHEMIA', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#e2c88f',
        align: 'center',
        stroke: '#2a1d12',
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.47, '12BITOVÉ HISTORICKÉ ARKÁDOVÉ RPG', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a68f68'
      })
      .setOrigin(0.5);

    this.createButton(width / 2, height * 0.64, 'NOVÁ HRA', () => {
      void this.startNewGame();
    });

    void this.addContinueButtonWhenReady(width, height);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sceneActive = false;
      delete document.body.dataset.menuReady;
    });
  }

  private async startNewGame(): Promise<void> {
    this.updateAccessibleStatus('Připravuji novou hru.');
    await this.saveSystem.clear();
    if (this.sceneActive) this.scene.start('GameScene', { continueGame: false });
  }

  private async addContinueButtonWhenReady(width: number, height: number): Promise<void> {
    const hasSave = await this.saveSystem.hasSave();
    if (!this.sceneActive) return;

    if (hasSave) {
      this.createButton(width / 2, height * 0.77, 'POKRAČOVAT', () => {
        this.scene.start('GameScene', { continueGame: true });
      });
      this.updateAccessibleStatus('Hlavní menu. Nová hra nebo pokračovat.');
    } else {
      this.updateAccessibleStatus('Hlavní menu. Nová hra.');
    }
    document.body.dataset.menuReady = 'true';
  }

  private createButton(x: number, y: number, label: string, action: () => void): void {
    const button = this.add
      .text(x, y, `  ${label}  `, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#1a140e',
        backgroundColor: '#c8aa6a',
        padding: { x: 12, y: 7 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#e0c689'));
    button.on('pointerout', () => button.setBackgroundColor('#c8aa6a'));
    button.on('pointerdown', action);
  }

  private updateAccessibleStatus(text: string): void {
    const status = document.querySelector<HTMLElement>('#game-status');
    if (status) status.textContent = text;
  }
}
