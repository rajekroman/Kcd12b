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
  private hudFrame!: Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private minimap!: Phaser.GameObjects.Graphics;
  private quickbar!: Phaser.GameObjects.Graphics;
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
    this.createMedievalHud();
    this.healthText = this.add.text(20, 13, 'ZDRAVÍ 100', this.hudStyle()).setDepth(182);
    this.staminaText = this.add.text(20, 25, 'VÝDRŽ 100', this.hudStyle()).setDepth(182);
    this.combatText = this.add.text(20, 38, 'POSTOJ: HORNÍ', this.hudStyle()).setDepth(182);
    this.enemyText = this.add
      .text(this.scale.width - 88, 13, '', this.hudStyle())
      .setOrigin(1, 0)
      .setDepth(182)
      .setVisible(false);
    this.objectiveText = this.add
      .text(this.scale.width - 18, 68, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '8px',
        color: '#f0dbab',
        wordWrap: { width: 105 },
        padding: { x: 5, y: 3 }
      })
      .setOrigin(1, 0)
      .setDepth(182);

    this.messageText = this.add
      .text(this.scale.width / 2, this.scale.height - 52, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4ddb0',
        backgroundColor: '#17110ddd',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(190);

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
    this.combatText.setText(
      document.body.dataset.visualReboot === 'village-street-authored-assets'
        ? `POSTOJ: ${direction}`
        : `Postoj: ${direction}${defense}${incoming}${dodge}`
    );
    this.objectiveText.setText(payload.objective);
    this.enemyText
      .setText(payload.banditHealth > 0 ? `Lapka ${payload.banditHealth}` : '')
      .setVisible(payload.banditHealth > 0);
    this.drawBar(this.healthBar, 14, 9, 82, payload.health / 100, 0xa84738);
    this.drawBar(this.staminaBar, 14, 22, 82, payload.stamina / 100, 0x78904a);

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
      fontSize: '7px',
      fontStyle: 'bold',
      color: '#f2dfba',
      shadow: { offsetX: 1, offsetY: 1, color: '#140d08', blur: 0, stroke: true, fill: true }
    };
  }

  private createMedievalHud(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.hudFrame = this.add.graphics().setDepth(180);
    this.hudFrame.fillStyle(0x211710, 0.94);
    this.hudFrame.fillRoundedRect(8, 7, 96, 50, 3);
    this.hudFrame.lineStyle(2, 0x0e0906, 1);
    this.hudFrame.strokeRoundedRect(7, 6, 98, 52, 3);
    this.hudFrame.lineStyle(1, 0xb18a4c, 1);
    this.hudFrame.strokeRoundedRect(10, 9, 92, 46, 2);
    this.hudFrame.fillStyle(0xb18a4c, 1);
    this.hudFrame.fillTriangle(13, 12, 19, 12, 16, 18);
    this.hudFrame.fillTriangle(93, 12, 99, 12, 96, 18);

    this.healthBar = this.add.graphics().setDepth(181);
    this.staminaBar = this.add.graphics().setDepth(181);
    this.drawBar(this.healthBar, 14, 9, 82, 1, 0xa84738);
    this.drawBar(this.staminaBar, 14, 22, 82, 1, 0x78904a);

    this.minimap = this.add.graphics().setDepth(180);
    this.minimap.fillStyle(0x1b241e, 0.95);
    this.minimap.fillRect(width - 86, 8, 74, 48);
    this.minimap.lineStyle(2, 0x0e0906, 1);
    this.minimap.strokeRect(width - 87, 7, 76, 50);
    this.minimap.lineStyle(1, 0xb18a4c, 1);
    this.minimap.strokeRect(width - 84, 10, 70, 44);
    this.minimap.fillStyle(0x667c55, 1);
    this.minimap.fillTriangle(width - 79, 48, width - 45, 17, width - 19, 48);
    this.minimap.fillStyle(0x9d7548, 1);
    this.minimap.lineStyle(2, 0xd0a45f, 1);
    this.minimap.lineBetween(width - 77, 48, width - 45, 29);
    this.minimap.lineBetween(width - 45, 29, width - 19, 48);
    this.minimap.fillStyle(0xd7c36e, 1);
    this.minimap.fillCircle(width - 45, 30, 2);

    this.hudFrame.fillStyle(0x211710, 0.94);
    this.hudFrame.fillRect(width - 124, 63, 112, 45);
    this.hudFrame.lineStyle(1, 0xb18a4c, 1);
    this.hudFrame.strokeRect(width - 123, 64, 110, 43);
    this.hudFrame.fillStyle(0x8e6b3d, 1);
    this.hudFrame.fillTriangle(width - 118, 69, width - 110, 69, width - 114, 76);
    this.add.text(width - 104, 67, 'ÚKOL', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#d5b46e'
    }).setDepth(182);

    this.quickbar = this.add.graphics().setDepth(180);
    const barWidth = 176;
    const startX = (width - barWidth) / 2;
    const y = height - 31;
    this.quickbar.fillStyle(0x1d150e, 0.95);
    this.quickbar.fillRect(startX - 6, y - 5, barWidth + 12, 29);
    this.quickbar.lineStyle(2, 0x0e0906, 1);
    this.quickbar.strokeRect(startX - 7, y - 6, barWidth + 14, 31);
    this.quickbar.lineStyle(1, 0xb18a4c, 1);
    this.quickbar.strokeRect(startX - 4, y - 3, barWidth + 8, 25);
    for (let index = 0; index < 8; index += 1) {
      const slotX = startX + index * 22;
      this.quickbar.fillStyle(index === 0 ? 0x75512b : 0x33251a, 1);
      this.quickbar.fillRect(slotX, y, 19, 19);
      this.quickbar.lineStyle(1, index === 0 ? 0xe3bd6d : 0x80623a, 1);
      this.quickbar.strokeRect(slotX, y, 19, 19);
      this.quickbar.fillStyle(index % 2 === 0 ? 0xc99554 : 0x708a66, 1);
      this.quickbar.fillRect(slotX + 6, y + 6, 7, 7);
    }
  }

  private drawBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, ratio: number, color: number): void {
    graphics.clear();
    graphics.fillStyle(0x160e0a, 1);
    graphics.fillRect(x, y, width, 6);
    graphics.fillStyle(color, 1);
    graphics.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * Math.max(0, Math.min(1, ratio))), 4);
  }
}
