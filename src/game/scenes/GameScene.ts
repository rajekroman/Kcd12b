import Phaser from 'phaser';
import { getEconomyState } from '../../core/EconomyStore';
import { EventBus, GameEvents } from '../../core/EventBus';
import {
  ATTACK_DIRECTIONS,
  calculateDamage,
  getAttackDirectionFromVector,
  getAttackDirectionLabel,
  isWithinMeleeImpactRange,
  resolveDefense,
  resolveDirectionalAttack,
  type AttackDirection
} from '../../systems/CombatSystem';
import { applyDialogueEffects, getDialogueForNpc } from '../../systems/DialogueSystem';
import { getEquipmentStats } from '../../systems/InventorySystem';
import {
  advanceQuestAfterBanditDefeat,
  createInitialQuestState,
  getQuestObjective,
  type QuestState
} from '../../systems/QuestSystem';
import { SaveSystem } from '../../systems/SaveSystem';
import { NpcManager } from '../NpcManager';
import { createVillageStreetPresentation } from '../../presentation/world';

interface GameSceneData {
  continueGame?: boolean;
}

interface TouchState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

interface PendingBanditAttack {
  direction: AttackDirection;
  landsAt: number;
}

interface ConsumableUsedPayload {
  healing: number;
}

type MovementKeys = Record<'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE', Phaser.Input.Keyboard.Key>;

const directionGlyph: Record<AttackDirection, string> = {
  high: '↑',
  left: '←',
  right: '→',
  'low-left': '↙',
  'low-right': '↘'
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private bandit!: Phaser.Physics.Arcade.Sprite;
  private banditGuardIndicator!: Phaser.GameObjects.Text;
  private npcManager!: NpcManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: MovementKeys;
  private directionKeys!: Record<AttackDirection, Phaser.Input.Keyboard.Key>;
  private blockKey!: Phaser.Input.Keyboard.Key;
  private dodgeKey!: Phaser.Input.Keyboard.Key;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private quest: QuestState = createInitialQuestState();
  private touch: TouchState = { up: false, down: false, left: false, right: false };
  private health = 100;
  private stamina = 100;
  private banditHealth = 55;
  private playerAttackReadyAt = 0;
  private banditAttackReadyAt = 0;
  private banditStaggerUntil = 0;
  private pendingBanditAttack?: PendingBanditAttack;
  private dialogueOpen = false;
  private dayClock = 35;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private saveSystem!: SaveSystem;
  private saveQueue: Promise<void> = Promise.resolve();
  private saveReady = false;
  private continueGame = false;
  private controlCleanup: Array<() => void> = [];
  private attackDirection: AttackDirection = 'high';
  private banditGuardDirection: AttackDirection = 'left';
  private banditGuardChangesAt = 0;
  private blocking = false;
  private blockStartedAt = 0;
  private dodgeCooldownUntil = 0;
  private dodgingUntil = 0;
  private invulnerableUntil = 0;
  private lastMovement = new Phaser.Math.Vector2(1, 0);

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.continueGame = Boolean(data.continueGame);
  }

  create(): void {
    document.body.classList.add('game-active');
    document.body.dataset.scene = 'game';
    document.body.dataset.saveReady = 'false';
    this.physics.world.setBounds(0, 0, 1200, 800);
    this.cameras.main.setBounds(0, 0, 1200, 800);
    this.cameras.main.setBackgroundColor('#3f4c31');
    this.saveSystem = SaveSystem.forBrowser(window.indexedDB, window.localStorage);

    this.createWorld();
    this.player = this.physics.add
      .sprite(240, 390, 'player')
      .setDepth(10)
      .setCollideWorldBounds(true);
    this.player.body?.setSize(12, 12).setOffset(2, 8);
    this.physics.add.collider(this.player, this.obstacles);

    this.npcManager = new NpcManager(this, this.obstacles, this.player);
    this.npcManager.create(this.dayClock);

    this.bandit = this.physics.add
      .sprite(830, 370, 'bandit')
      .setDepth(10)
      .setCollideWorldBounds(true);
    this.bandit.body?.setSize(12, 12).setOffset(2, 8);
    this.physics.add.collider(this.bandit, this.obstacles);
    this.banditGuardIndicator = this.add
      .text(this.bandit.x, this.bandit.y - 22, directionGlyph[this.banditGuardDirection], {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e7c77d',
        backgroundColor: '#17110dcc',
        padding: { x: 3, y: 1 }
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(2);
    this.configureKeyboard();

    this.nightOverlay = this.add
      .rectangle(600, 400, 1200, 800, 0x08121e, 0)
      .setScrollFactor(0)
      .setDepth(90)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.installVillageStreetPresentation();

    this.bindControls();
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    this.emitHud();
    void this.initializeSaveState();

    this.time.addEvent({ delay: 10000, loop: true, callback: () => this.save() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unbindControls();
      this.npcManager.destroy();
      document.body.classList.remove('game-active');
      delete document.body.dataset.scene;
      delete document.body.dataset.saveReady;
      delete document.body.dataset.lastSave;
      delete document.body.dataset.playerPresentationProxy;
      delete document.body.dataset.presentationNpcCount;
      delete document.body.dataset.characterProjection;
      if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    });
  }

  private installVillageStreetPresentation(): void {
    const presentation = createVillageStreetPresentation(this, this.obstacles);
    this.data.set('villageDayImage', presentation.dayImage);
    this.data.set('villageEveningImage', presentation.eveningImage);

    this.children.list.forEach((gameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Image) {
        if (new Set(['grass', 'road', 'tree', 'house']).has(gameObject.texture.key)) {
          gameObject.setVisible(false);
        }
        return;
      }
      if (gameObject instanceof Phaser.GameObjects.Text) gameObject.setVisible(false);
    });

    const camera = this.cameras.main;
    camera.stopFollow();
    camera.setZoom(0.5);
    camera.setBounds(0, 0, presentation.worldWidth, presentation.worldHeight);
    camera.setScroll(0, 0);
    camera.roundPixels = true;
    document.body.dataset.cameraPresentation = 'fixed-scenic-checkpoint';
    document.body.dataset.playerPresentationScale = '3.1';
  }

  update(time: number, delta: number): void {
    if (!this.saveReady || this.dialogueOpen) {
      this.player.setVelocity(0);
      return;
    }

    this.updateMovement(time);
    this.updateKeyboardCombat(time);
    this.updateBandit(time);
    this.updateDayNight(delta);
    this.npcManager.update(this.dayClock);

    if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) this.attack(this.attackDirection, time);
  }

  private configureKeyboard(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available.');

    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D,E,SPACE') as MovementKeys;
    this.blockKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.dodgeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.directionKeys = {
      high: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      'low-left': keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      'low-right': keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE)
    };
  }

  private createWorld(): void {
    for (let y = 0; y < 800; y += 16) {
      for (let x = 0; x < 1200; x += 16) {
        const onRoad = y > 340 && y < 430;
        this.add.image(x, y, onRoad ? 'road' : 'grass').setOrigin(0).setDepth(0);
      }
    }

    this.obstacles = this.physics.add.staticGroup();
  }

  private updateMovement(time: number): void {
    if (time < this.dodgingUntil) return;

    const speed = this.blocking ? 62 : 105;
    let x = 0;
    let y = 0;

    if (this.cursors.left?.isDown || this.wasd.A.isDown || this.touch.left) x -= 1;
    if (this.cursors.right?.isDown || this.wasd.D.isDown || this.touch.right) x += 1;
    if (this.cursors.up?.isDown || this.wasd.W.isDown || this.touch.up) y -= 1;
    if (this.cursors.down?.isDown || this.wasd.S.isDown || this.touch.down) y += 1;

    const direction = new Phaser.Math.Vector2(x, y).normalize();
    this.player.setVelocity(direction.x * speed, direction.y * speed);

    if (direction.lengthSq() > 0) {
      this.lastMovement.copy(direction);
      this.player.setFlipX(direction.x < 0);
      this.setAttackDirection(
        getAttackDirectionFromVector(direction.x, direction.y, this.attackDirection),
        false
      );
    }
  }

  private updateKeyboardCombat(time: number): void {
    ATTACK_DIRECTIONS.forEach((direction) => {
      if (Phaser.Input.Keyboard.JustDown(this.directionKeys[direction])) {
        this.setAttackDirection(direction);
      }
    });

    if (Phaser.Input.Keyboard.JustDown(this.blockKey)) this.startBlock(time);
    if (Phaser.Input.Keyboard.JustUp(this.blockKey)) this.endBlock();
    if (Phaser.Input.Keyboard.JustDown(this.dodgeKey)) this.dodge(time);
  }

  private updateBandit(time: number): void {
    if (!this.bandit.active || this.quest.step !== 'defeat-bandit') {
      this.banditGuardIndicator.setVisible(false);
      return;
    }

    this.banditGuardIndicator
      .setVisible(true)
      .setPosition(this.bandit.x, this.bandit.y - 22)
      .setText(directionGlyph[this.pendingBanditAttack?.direction ?? this.banditGuardDirection]);

    if (time >= this.banditGuardChangesAt && !this.pendingBanditAttack) {
      this.banditGuardDirection = Phaser.Utils.Array.GetRandom([...ATTACK_DIRECTIONS]);
      this.banditGuardChangesAt = time + Phaser.Math.Between(850, 1450);
    }

    if (this.pendingBanditAttack) {
      this.bandit.setVelocity(0);
      if (time >= this.pendingBanditAttack.landsAt) this.resolveBanditAttack(time);
      return;
    }

    if (time < this.banditStaggerUntil) {
      this.bandit.setVelocity(0);
      return;
    }

    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    if (distance < 170 && distance > 34) {
      this.physics.moveToObject(this.bandit, this.player, 58);
    } else {
      this.bandit.setVelocity(0);
    }

    if (distance <= 34 && time >= this.banditAttackReadyAt) {
      const direction = Phaser.Utils.Array.GetRandom([...ATTACK_DIRECTIONS]);
      this.pendingBanditAttack = { direction, landsAt: time + 380 };
      this.banditAttackReadyAt = time + 1250;
      EventBus.emit(
        GameEvents.MESSAGE,
        `Lapka chystá ${getAttackDirectionLabel(direction)} útok.`
      );
      this.emitHud();
      this.tweens.add({
        targets: this.bandit,
        scaleX: 1.18,
        scaleY: 0.88,
        yoyo: true,
        duration: 170
      });
    }
  }

  private resolveBanditAttack(time: number): void {
    const pending = this.pendingBanditAttack;
    if (!pending) return;

    this.pendingBanditAttack = undefined;
    const impactDistance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    if (!isWithinMeleeImpactRange(impactDistance)) {
      EventBus.emit(GameEvents.MESSAGE, 'Ustoupil jsi mimo dosah lapkova útoku.');
      this.emitHud();
      return;
    }

    if (time < this.invulnerableUntil) {
      EventBus.emit(GameEvents.MESSAGE, 'Úhyb minul lapkův útok.');
      this.emitHud();
      return;
    }

    const equipment = getEquipmentStats(getEconomyState().inventory);
    const incomingDamage = Math.max(
      1,
      calculateDamage({
        baseDamage: 12,
        staminaRatio: 0.8,
        type: 'slash',
        armor: 'cloth'
      }) - equipment.armor
    );
    const defense = resolveDefense({
      incomingDamage,
      incomingDirection: pending.direction,
      guardDirection: this.attackDirection,
      blocking: this.blocking,
      blockStartedAt: this.blockStartedAt,
      hitAt: time,
      stamina: this.stamina
    });

    this.stamina = Math.max(0, this.stamina - defense.staminaCost);
    this.health = Math.max(0, this.health - defense.damage);
    if (defense.staggerMs > 0) this.banditStaggerUntil = time + defense.staggerMs;

    const messages: Record<typeof defense.outcome, string> = {
      hit: `Lapka tě zasáhl za ${defense.damage}.`,
      blocked: `Kryt zachytil úder. Zranění ${defense.damage}.`,
      'partial-block': `Špatný směr krytu. Zranění ${defense.damage}.`,
      'perfect-block': 'Dokonalý kryt! Lapka ztratil rovnováhu.',
      'guard-break': `Lapka prolomil vyčerpaný kryt za ${defense.damage}.`
    };
    EventBus.emit(GameEvents.MESSAGE, messages[defense.outcome]);

    if (defense.damage > 0) this.cameras.main.shake(90, 0.006);
    if (this.health === 0) this.handlePlayerDefeat();
    this.emitHud();
  }

  private interact = (): void => {
    if (!this.saveReady) return;
    const npc = this.npcManager.getNearestInteractable();
    if (!npc) {
      EventBus.emit(GameEvents.MESSAGE, 'Nikdo není dost blízko.');
      return;
    }

    const definition = getDialogueForNpc(npc.definition.id, this.quest);
    if (!definition) return;
    this.dialogueOpen = true;
    this.player.setVelocity(0);
    EventBus.emit(GameEvents.DIALOGUE_OPEN, {
      dialogueId: definition.id,
      speaker: npc.definition.name,
      text: definition.text,
      actionLabel: definition.actionLabel,
      onClose: () => {
        this.dialogueOpen = false;
        this.quest = applyDialogueEffects(definition, this.quest);
        this.save();
        this.emitHud();
      }
    });
  };

  private attack(direction: AttackDirection, time: number): void {
    if (!this.saveReady || this.dialogueOpen || time < this.playerAttackReadyAt) return;
    this.setAttackDirection(direction, false);
    this.playerAttackReadyAt = time + 430;
    EventBus.emit(GameEvents.PLAYER_ATTACKED, { direction });
    this.tweens.add({
      targets: this.player,
      angle: direction === 'left' ? -12 : direction === 'right' ? 12 : 0,
      yoyo: true,
      duration: 90
    });

    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    const result = resolveDirectionalAttack({
      distance,
      direction,
      targetGuardDirection: this.banditGuardDirection,
      stamina: this.stamina,
      baseDamage: 14,
      targetArmor: 'cloth'
    });
    this.stamina = Math.max(0, this.stamina - result.staminaCost);

    if (this.bandit.active && this.quest.step === 'defeat-bandit' && result.hit) {
      this.banditHealth = Math.max(0, this.banditHealth - result.damage);
      if (this.banditHealth === 0) {
        this.bandit.disableBody(true, true);
        this.banditGuardIndicator.setVisible(false);
        this.quest = advanceQuestAfterBanditDefeat(this.quest);
        EventBus.emit(GameEvents.MESSAGE, 'Lapka padl. Vrať se za Bohdanem.');
        this.cameras.main.shake(100, 0.004);
        this.save();
      } else {
        EventBus.emit(
          GameEvents.MESSAGE,
          result.guardMatched
            ? `Lapka kryje správný směr. Zásah jen za ${result.damage}.`
            : `Zásah z otevřeného směru za ${result.damage}.`
        );
      }
    } else if (this.quest.step === 'defeat-bandit' && !result.hit) {
      EventBus.emit(GameEvents.MESSAGE, 'Útok nedosáhl na lapku.');
    }

    this.emitHud();
  }

  private startBlock(time: number): void {
    if (!this.saveReady || this.dialogueOpen || time < this.dodgingUntil) return;
    this.blocking = true;
    this.blockStartedAt = time;
    this.player.setTint(0x9fc6df);
    this.emitHud();
  }

  private endBlock(): void {
    if (!this.blocking) return;
    this.blocking = false;
    this.player.clearTint();
    this.emitHud();
  }

  private dodge(time: number): void {
    if (!this.saveReady || this.dialogueOpen || time < this.dodgeCooldownUntil) return;
    const direction = this.lastMovement.lengthSq() > 0
      ? this.lastMovement.clone().normalize()
      : new Phaser.Math.Vector2(1, 0);
    this.dodgeCooldownUntil = time + 1100;
    this.dodgingUntil = time + 170;
    this.invulnerableUntil = time + 220;
    this.player.setVelocity(direction.x * 255, direction.y * 255);
    EventBus.emit(GameEvents.MESSAGE, 'Úhyb.');
    this.emitHud();
  }

  private setAttackDirection(direction: AttackDirection, announce = true): void {
    if (this.attackDirection === direction) return;
    this.attackDirection = direction;
    if (announce) EventBus.emit(GameEvents.MESSAGE, `Postoj: ${getAttackDirectionLabel(direction)}.`);
    this.emitHud();
  }

  private updateDayNight(delta: number): void {
    this.dayClock = (this.dayClock + delta * 0.0008) % 100;
    const phase = this.dayClock / 100;
    const darkness = Math.max(0, Math.sin((phase - 0.25) * Math.PI * 2)) * 0.52;
    this.nightOverlay.setAlpha(darkness);

    const dayImage = this.data.get('villageDayImage') as Phaser.GameObjects.Image | undefined;
    const eveningImage = this.data.get('villageEveningImage') as
      | Phaser.GameObjects.Image
      | undefined;
    dayImage?.setVisible(darkness < 0.18);
    eveningImage?.setVisible(darkness >= 0.18);

    if (this.blocking) {
      this.stamina = Math.max(0, this.stamina - delta * 0.004);
      if (this.stamina === 0) this.endBlock();
    } else {
      this.stamina = Math.min(100, this.stamina + delta * 0.006);
    }
    this.emitHud();
  }

  private emitHud(): void {
    EventBus.emit(GameEvents.HUD_UPDATE, {
      health: this.health,
      stamina: this.stamina,
      objective: getQuestObjective(this.quest),
      banditHealth: this.banditHealth,
      attackDirection: this.attackDirection,
      blocking: this.blocking,
      incomingDirection: this.pendingBanditAttack?.direction,
      dodgeReady: this.time.now >= this.dodgeCooldownUntil
    });
  }

  private bindControls(): void {
    const bind = <T>(event: string, listener: (payload: T) => void): void => {
      EventBus.on(event, listener);
      this.controlCleanup.push(() => EventBus.off(event, listener));
    };

    bind<TouchState>(GameEvents.MOVE, (nextTouch) => {
      this.touch = nextTouch;
    });
    bind<void>(GameEvents.INTERACT, () => this.interact());
    bind<AttackDirection>(GameEvents.ATTACK, (direction) => this.attack(direction, this.time.now));
    bind<void>(GameEvents.BLOCK_START, () => this.startBlock(this.time.now));
    bind<void>(GameEvents.BLOCK_END, () => this.endBlock());
    bind<void>(GameEvents.DODGE, () => this.dodge(this.time.now));
    bind<ConsumableUsedPayload>(GameEvents.CONSUMABLE_USED, ({ healing }) => {
      this.health = Math.min(100, this.health + healing);
      this.emitHud();
      this.save();
    });
  }

  private unbindControls(): void {
    this.controlCleanup.forEach((dispose) => dispose());
    this.controlCleanup.length = 0;
    this.touch = { up: false, down: false, left: false, right: false };
  }

  private handlePlayerDefeat(): void {
    this.health = 100;
    this.stamina = 100;
    this.player.setPosition(240, 390).setVelocity(0);
    this.pendingBanditAttack = undefined;
    this.banditStaggerUntil = 0;
    EventBus.emit(GameEvents.MESSAGE, 'Byl jsi poražen. Vracíš se na náves.');
  }

  private async initializeSaveState(): Promise<void> {
    const loaded = this.continueGame ? await this.saveSystem.load() : null;
    if (loaded) {
      this.health = loaded.player.health;
      this.stamina = loaded.player.stamina;
      this.dayClock = loaded.world.dayClock;
      this.quest = loaded.quest;
    }
    this.npcManager.snapToSchedule(this.dayClock);
    this.saveReady = true;
    document.body.dataset.saveReady = 'true';
    this.emitHud();
  }

  private save(): void {
    if (!this.saveReady) return;
    const state = {
      version: 5,
      player: { health: this.health, stamina: this.stamina },
      world: { dayClock: this.dayClock },
      quest: this.quest,
      economy: getEconomyState()
    };
    this.saveQueue = this.saveQueue
      .then(() => this.saveSystem.save(state))
      .then(() => {
        document.body.dataset.lastSave = String(Date.now());
      })
      .catch((error: unknown) => {
        EventBus.emit(
          GameEvents.MESSAGE,
          error instanceof Error ? `Uložení selhalo: ${error.message}` : 'Uložení selhalo.'
        );
      });
  }
}
