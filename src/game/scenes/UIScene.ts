import Phaser from 'phaser';
import { EventBus, GameEvents } from '../../core/EventBus';
import {
  getPortraitFrameIndex,
  getPortraitTextureKey,
  type PortraitExpression
} from '../../data/portraits';
import {
  getAttackDirectionLabel,
  type AttackDirection
} from '../../systems/CombatSystem';
import { getDialogueDefinitionById } from '../../systems/DialogueSystem';

interface HudPayload {
  health: number;
  stamina: number;
  objective: string;
  banditHealth: number;
  attackDirection: AttackDirection;
  blocking: boolean;
  incomingDirection?: AttackDirection;
  dodgeReady: boolean;
}

interface DialoguePayload {
  dialogueId: string;
  speaker: string;
  text: string;
  actionLabel: string;
  onClose: () => void;
}

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;
  private combatText!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private dialogueContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  create(): void {
    document.body.dataset.uiScene = 'active';
    this.healthText = this.add.text(12, 10, 'Zdraví 100', this.hudStyle());
    this.staminaText = this.add.text(12, 27, 'Výdrž 100', this.hudStyle());
    this.combatText = this.add.text(12, 44, 'Postoj: horní', this.hudStyle());
    this.enemyText = this.add
      .text(this.scale.width - 12, 10, '', this.hudStyle())
      .setOrigin(1, 0)
      .setVisible(false);
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
    EventBus.emit(GameEvents.UI_READY);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.HUD_UPDATE, this.onHudUpdate, this);
      EventBus.off(GameEvents.MESSAGE, this.onMessage, this);
      EventBus.off(GameEvents.DIALOGUE_OPEN, this.onDialogueOpen, this);
      delete document.body.dataset.uiScene;
      delete document.body.dataset.health;
      delete document.body.dataset.stamina;
      delete document.body.dataset.attackDirection;
      delete document.body.dataset.blocking;
      delete document.body.dataset.dodgeReady;
      delete document.body.dataset.dialogue;
      delete document.body.dataset.dialogueId;
      delete document.body.dataset.dialoguePortrait;
      delete document.body.dataset.dialogueExpression;
      delete document.body.dataset.lastMessage;
    });
  }

  private onHudUpdate(payload: HudPayload): void {
    const direction = getAttackDirectionLabel(payload.attackDirection);
    const incoming = payload.incomingDirection
      ? ` · Hrozba: ${getAttackDirectionLabel(payload.incomingDirection)}`
      : '';
    const defense = payload.blocking ? ' · Kryt' : '';
    const dodge = payload.dodgeReady ? ' · Úhyb připraven' : '';

    this.healthText.setText(`Zdraví ${payload.health}`);
    this.staminaText.setText(`Výdrž ${payload.stamina}`);
    this.combatText.setText(`Postoj: ${direction}${defense}${incoming}${dodge}`);
    this.objectiveText.setText(payload.objective);
    this.enemyText
      .setText(payload.banditHealth > 0 ? `Lapka ${payload.banditHealth}` : '')
      .setVisible(payload.banditHealth > 0);

    document.body.dataset.health = String(payload.health);
    document.body.dataset.stamina = String(payload.stamina);
    document.body.dataset.attackDirection = payload.attackDirection;
    document.body.dataset.blocking = String(payload.blocking);
    document.body.dataset.dodgeReady = String(payload.dodgeReady);

    this.updateAccessibleStatus(
      `Zdraví ${payload.health}. Výdrž ${payload.stamina}. Postoj ${direction}. ${payload.objective}`
    );
  }

  private onMessage(message: string): void {
    this.messageText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.messageText);
    this.tweens.add({ targets: this.messageText, alpha: 0, delay: 1700, duration: 450 });
    document.body.dataset.lastMessage = message;
    this.updateAccessibleStatus(message);
  }

  private onDialogueOpen(payload: DialoguePayload): void {
    this.dialogueContainer?.destroy(true);
    const definition = getDialogueDefinitionById(payload.dialogueId);
    const expression: PortraitExpression = definition?.expression ?? 'neutral';
    const width = Math.min(438, this.scale.width - 24);
    const height = 132;
    const x = this.scale.width / 2;
    const y = this.scale.height - 99;
    const portraitWidth = 64;
    const leftEdge = -width / 2;
    const portraitX = leftEdge + 40;
    const copyX = leftEdge + portraitWidth + 18;
    const copyWidth = width - portraitWidth - 42;

    const background = this.add
      .rectangle(0, 0, width, height, 0x1a130e, 0.97)
      .setStrokeStyle(2, 0xb99b61);
    const portraitBorder = this.add
      .rectangle(portraitX, -3, 62, 74, 0x0f0c09, 1)
      .setStrokeStyle(1, 0xd1b36e);
    const portrait = definition
      ? this.add
          .image(
            portraitX,
            -3,
            getPortraitTextureKey(definition.npcId),
            getPortraitFrameIndex(expression)
          )
          .setScale(1.18)
      : this.add.rectangle(portraitX, -3, 54, 66, 0x2c2118);
    const expressionLabel = this.add
      .text(portraitX, 42, this.expressionLabel(expression), {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#c9ad76',
        backgroundColor: '#120e0bcc',
        padding: { x: 3, y: 1 }
      })
      .setOrigin(0.5);
    const speaker = this.add.text(copyX, -55, payload.speaker, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#e9cc8c'
    });
    const body = this.add.text(copyX, -31, payload.text, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#eee2ca',
      wordWrap: { width: copyWidth }
    });
    const button = this.add
      .text(width / 2 - 12, 50, payload.actionLabel, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#17110d',
        backgroundColor: '#d1b36e',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    this.dialogueContainer = this.add
      .container(x, y, [
        background,
        portraitBorder,
        portrait,
        expressionLabel,
        speaker,
        body,
        button
      ])
      .setDepth(200);
    document.body.dataset.dialogue = payload.speaker;
    document.body.dataset.dialogueId = payload.dialogueId;
    document.body.dataset.dialoguePortrait = definition?.npcId ?? '';
    document.body.dataset.dialogueExpression = expression;
    this.updateAccessibleStatus(
      `${payload.speaker}, výraz ${this.expressionLabel(expression)}: ${payload.text}`
    );

    button.once('pointerdown', () => {
      this.dialogueContainer?.destroy(true);
      this.dialogueContainer = undefined;
      delete document.body.dataset.dialogue;
      delete document.body.dataset.dialogueId;
      delete document.body.dataset.dialoguePortrait;
      delete document.body.dataset.dialogueExpression;
      payload.onClose();
      EventBus.emit(GameEvents.DIALOGUE_CLOSE);
    });
  }

  private expressionLabel(expression: PortraitExpression): string {
    const labels: Record<PortraitExpression, string> = {
      neutral: 'klidný',
      warm: 'vlídný',
      stern: 'přísný',
      concerned: 'ustaraný',
      suspicious: 'nedůvěřivý',
      proud: 'hrdý'
    };
    return labels[expression];
  }

  private updateAccessibleStatus(text: string): void {
    const status = document.querySelector<HTMLElement>('#game-status');
    if (status) status.textContent = text;
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
