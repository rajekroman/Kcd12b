import Phaser from 'phaser';
import { EventBus, GameEvents } from '../../core/EventBus';

interface HudPayload {
  health: number;
  stamina: number;
  objective: string;
  banditHealth: number;
}

interface DialoguePayload {
  speaker: string;
  text: string;
  actionLabel: string;
  onClose: () => void;
}

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private dialogueContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.healthText = this.add.text(12, 10, 'Zdraví 100', this.hudStyle());
    this.staminaText = this.add.text(12, 27, 'Výdrž 100', this.hudStyle());
    this.objectiveText = this.add
      .text(this.scale.width / 2, 10, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#f0dbab',
        backgroundColor: '#17110dcc',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0.5, 0);

    this.messageText = this.add
      .text(this.scale.width / 2, this.scale.height - 52, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4ddb0',
        backgroundColor: '#17110ddd',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0.5)
      .setAlpha(0);

    EventBus.on(GameEvents.HUD_UPDATE, this.onHudUpdate, this);
    EventBus.on(GameEvents.MESSAGE, this.onMessage, this);
    EventBus.on(GameEvents.DIALOGUE_OPEN, this.onDialogueOpen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.HUD_UPDATE, this.onHudUpdate, this);
      EventBus.off(GameEvents.MESSAGE, this.onMessage, this);
      EventBus.off(GameEvents.DIALOGUE_OPEN, this.onDialogueOpen, this);
    });
  }

  private onHudUpdate(payload: HudPayload): void {
    this.healthText.setText(`Zdraví ${payload.health}`);
    this.staminaText.setText(`Výdrž ${payload.stamina}`);
    this.objectiveText.setText(payload.objective);
  }

  private onMessage(message: string): void {
    this.messageText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.messageText);
    this.tweens.add({ targets: this.messageText, alpha: 0, delay: 1700, duration: 450 });
  }

  private onDialogueOpen(payload: DialoguePayload): void {
    this.dialogueContainer?.destroy(true);
    const width = Math.min(420, this.scale.width - 30);
    const x = this.scale.width / 2;
    const y = this.scale.height - 95;
    const background = this.add
      .rectangle(0, 0, width, 116, 0x1a130e, 0.96)
      .setStrokeStyle(2, 0xb99b61);
    const speaker = this.add.text(-width / 2 + 12, -48, payload.speaker, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#e9cc8c'
    });
    const body = this.add.text(-width / 2 + 12, -25, payload.text, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#eee2ca',
      wordWrap: { width: width - 24 }
    });
    const button = this.add
      .text(width / 2 - 12, 38, payload.actionLabel, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#17110d',
        backgroundColor: '#d1b36e',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    this.dialogueContainer = this.add
      .container(x, y, [background, speaker, body, button])
      .setDepth(200);
    button.once('pointerdown', () => {
      this.dialogueContainer?.destroy(true);
      this.dialogueContainer = undefined;
      payload.onClose();
      EventBus.emit(GameEvents.DIALOGUE_CLOSE);
    });
  }

  private hudStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f2dfba',
      backgroundColor: '#17110dcc',
      padding: { x: 6, y: 3 }
    };
  }
}
