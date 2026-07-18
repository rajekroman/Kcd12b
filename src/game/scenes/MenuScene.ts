import Phaser from 'phaser';
import { SaveSystem } from '../../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    document.body.classList.remove('game-active');
    document.body.dataset.scene = 'menu';
    delete document.body.dataset.uiScene;
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.updateAccessibleStatus('Hlavní menu. Nová hra.');

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
      new SaveSystem(window.localStorage).clear();
      this.scene.start('GameScene', { continueGame: false });
    });

    const save = new SaveSystem(window.localStorage).load();
    if (save) {
      this.createButton(width / 2, height * 0.77, 'POKRAČOVAT', () => {
        this.scene.start('GameScene', { continueGame: true });
      });
      this.updateAccessibleStatus('Hlavní menu. Nová hra nebo pokračovat.');
    }
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
