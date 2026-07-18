import Phaser from 'phaser';
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
import {
  advanceQuestAfterBanditDefeat,
  advanceQuestAfterDialogue,
  createInitialQuestState,
  getQuestObjective,
  type QuestState
} from '../../systems/QuestSystem';
import { SaveSystem } from '../../systems/SaveSystem';

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
  private smith!: Phaser.Physics.Arcade.Sprite;
  private bandit!: Phaser.Physics.Arcade.Sprite;
  private banditGuardIndicator!: Phaser.GameObjects.Text;
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
  private dayClock = 0;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private saveSystem!: SaveSystem;
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
    this.physics.world.setBounds(0, 0, 1200, 800);
    this.cameras.main.setBounds(0, 0, 1200, 800);
    this.cameras.main.setBackgroundColor('#3f4c31');
    this.saveSystem = new SaveSystem(window.localStorage);

    this.createWorld();
    this.player = this.physics.add
      .sprite(240, 390, 'player')
      .setDepth(10)
      .setCollideWorldBounds(true);
    this.player.body?.setSize(12, 12).setOffset(2, 8);
    this.physics.add.collider(this.player, this.obstacles);

    this.smith = this.physics.add.staticSprite(355, 330, 'smith').setDepth(10);
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

    this.bindControls();
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    this.loadIfRequested();
    this.emitHud();

    this.time.addEvent({ delay: 10000, loop: true, callback: () => this.save() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unbindControls();
      document.body.classList.remove('game-active');
      delete document.body.dataset.scene;
      if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    });
  }

  update(time: number, delta: number): void {
    if (this.dialogueOpen) {
      this.player.setVelocity(0);
      return;
    }

    this.updateMovement(time);
    this.updateKeyboardCombat(time);
    this.updateBandit(time);
    this.updateDayNight(delta);

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
    const trees = [
      [120, 120],
      [180, 160],
      [250, 120],
      [680, 120],
      [730, 150],
      [900, 140],
      [1010, 180],
      [120, 620],
      [200, 670],
      [710, 640],
      [850, 680],
      [1050, 620]
    ];
    trees.forEach(([x, y]) => this.obstacles.create(x, y, 'tree').setDepth(6));
    this.obstacles.create(390, 255, 'house').setDepth(5);
    this.obstacles.create(510, 250, 'house').setDepth(5);
    this.obstacles.create(280, 520, 'house').setDepth(5);

    this.add.text(290, 300, 'KOVÁRNA', { fontSize: '8px', color: '#f0d9a7' }).setDepth(11);
    this.add
      .text(760, 325, 'VÝCHODNÍ CESTA', { fontSize: '8px', color: '#d6c294' })
      .setDepth(11);
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

    const incomingDamage = calculateDamage({
      baseDamage: 12,
      staminaRatio: 0.8,
      type: 'slash',
      armor: 'cloth'
    });
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
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.smith);
    if (distance > 55) {
      EventBus.emit(GameEvents.MESSAGE, 'Nikdo není dost blízko.');
      return;
    }

    this.dialogueOpen = true;
    this.endBlock();
    const firstMeeting = this.quest.step === 'meet-smith';
    EventBus.emit(GameEvents.DIALOGUE_OPEN, {
      speaker: 'Kovář Bohdan',
      text: firstMeeting
        ? 'Na východní cestě se usadil lapka. Vezmi tenhle meč a ukaž, že nejsi jen učedník.'
        : this.quest.step === 'complete'
          ? 'Dobrá práce. Ocel poslouchá toho, kdo nezaváhá.'
          : 'Lapka je stále na cestě. Směr útoku vyber pohybem nebo klávesami 1–5.',
      actionLabel: 'Pokračovat',
      onClose: () => {
        if (firstMeeting) {
          this.quest = advanceQuestAfterDialogue(this.quest);
          this.emitHud();
          this.save();
        }
        this.dialogueOpen = false;
      }
    });
  };

  private attack = (direction = this.attackDirection, time = this.time.now): void => {
    if (time < this.playerAttackReadyAt || this.dialogueOpen || this.blocking) return;

    const resolution = resolveDirectionalAttack({
      baseDamage: 24,
      staminaRatio: this.stamina / 100,
      type: 'slash',
      armor: 'cloth',
      critical: false,
      attackDirection: direction,
      guardDirection: this.bandit.active ? this.banditGuardDirection : undefined
    });
    if (this.stamina < resolution.staminaCost) {
      EventBus.emit(GameEvents.MESSAGE, 'Nemáš dost výdrže k útoku.');
      return;
    }

    this.setAttackDirection(direction, false);
    this.playerAttackReadyAt = time + (direction === 'high' ? 620 : 450);
    this.stamina = Math.max(0, this.stamina - resolution.staminaCost);
    this.emitHud();

    const attackAngle: Record<AttackDirection, number> = {
      high: 0,
      left: -24,
      right: 24,
      'low-left': -14,
      'low-right': 14
    };
    this.tweens.add({
      targets: this.player,
      angle: attackAngle[direction],
      scaleX: direction === 'high' ? 1.12 : 1,
      scaleY: direction === 'high' ? 0.88 : 1,
      yoyo: true,
      duration: 100
    });

    if (!this.bandit.active) return;
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    if (distance > 58) {
      EventBus.emit(GameEvents.MESSAGE, 'Útok minul.');
      return;
    }

    this.banditHealth = Math.max(0, this.banditHealth - resolution.damage);
    this.bandit.setTintFill(0xffffff);
    this.time.delayedCall(80, () => this.bandit.clearTint());

    const hitMessages: Record<typeof resolution.outcome, string> = {
      hit: `${getAttackDirectionLabel(direction)} zásah za ${resolution.damage}.`,
      guarded: `Lapka vykryl ${getAttackDirectionLabel(direction)} útok. Zásah ${resolution.damage}.`,
      opening: `Zásah do odkrytého směru za ${resolution.damage}!`
    };
    EventBus.emit(GameEvents.MESSAGE, hitMessages[resolution.outcome]);

    if (this.banditHealth === 0) {
      this.bandit.disableBody(true, true);
      this.banditGuardIndicator.setVisible(false);
      this.pendingBanditAttack = undefined;
      this.quest = advanceQuestAfterBanditDefeat(this.quest);
      EventBus.emit(GameEvents.MESSAGE, 'Lapka byl poražen. Úkol dokončen.');
      this.save();
    }
    this.emitHud();
  };

  private startBlock = (time = this.time.now): void => {
    if (this.dialogueOpen || time < this.dodgingUntil || this.stamina < 5) return;
    if (!this.blocking) this.blockStartedAt = time;
    this.blocking = true;
    this.player.setTint(0xd8e4ff);
    this.emitHud();
  };

  private endBlock = (): void => {
    if (!this.blocking) return;
    this.blocking = false;
    this.player.clearTint();
    this.emitHud();
  };

  private dodge = (time = this.time.now): void => {
    if (
      this.dialogueOpen ||
      time < this.dodgeCooldownUntil ||
      time < this.dodgingUntil ||
      this.stamina < 22
    ) {
      return;
    }

    this.endBlock();
    this.stamina = Math.max(0, this.stamina - 22);
    this.dodgingUntil = time + 180;
    this.invulnerableUntil = time + 300;
    this.dodgeCooldownUntil = time + 760;
    const direction = this.lastMovement.clone().normalize();
    this.player.setVelocity(direction.x * 310, direction.y * 310).setAlpha(0.58);
    this.time.delayedCall(190, () => {
      this.player.setVelocity(0).setAlpha(1);
    });
    this.time.delayedCall(770, () => this.emitHud());
    EventBus.emit(GameEvents.MESSAGE, 'Úhyb.');
    this.emitHud();
  };

  private setAttackDirection(direction: AttackDirection, announce = true): void {
    if (this.attackDirection === direction) return;
    this.attackDirection = direction;
    if (announce) {
      EventBus.emit(GameEvents.MESSAGE, `Postoj: ${getAttackDirectionLabel(direction)}.`);
    }
    this.emitHud();
  }

  private updateDayNight(delta: number): void {
    this.dayClock = (this.dayClock + delta / 1000) % 120;
    const phase = this.dayClock / 120;
    const darkness = Math.max(0, Math.sin((phase - 0.25) * Math.PI * 2)) * 0.52;
    this.nightOverlay.setAlpha(darkness);

    if (this.blocking) {
      this.stamina = Math.max(0, this.stamina - delta * 0.004);
      if (this.stamina === 0) {
        this.endBlock();
        EventBus.emit(GameEvents.MESSAGE, 'Kryt povolil vyčerpáním.');
      }
    } else if (this.time.now >= this.dodgingUntil) {
      this.stamina = Math.min(100, this.stamina + delta * 0.012);
    }
  }

  private handlePlayerDefeat(): void {
    this.player.setVelocity(0).setTint(0x7a1f1f);
    this.blocking = false;
    EventBus.emit(GameEvents.MESSAGE, 'Padl jsi. Probouzíš se u kovárny.');
    this.time.delayedCall(1200, () => {
      this.health = 100;
      this.stamina = 70;
      this.player.setPosition(240, 390).clearTint();
      this.pendingBanditAttack = undefined;
      this.emitHud();
      this.save();
    });
  }

  private emitHud(): void {
    EventBus.emit(GameEvents.HUD_UPDATE, {
      health: this.health,
      stamina: Math.round(this.stamina),
      objective: getQuestObjective(this.quest),
      banditHealth: this.bandit.active ? this.banditHealth : 0,
      attackDirection: this.attackDirection,
      blocking: this.blocking,
      incomingDirection: this.pendingBanditAttack?.direction,
      dodgeReady: this.time.now >= this.dodgeCooldownUntil
    });
  }

  private bindControls(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      let attackGestureStart: { x: number; y: number } | undefined;

      const start = (event: PointerEvent) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);

        if (control && control in this.touch) {
          this.touch[control as keyof TouchState] = true;
          return;
        }
        if (control === 'interact') EventBus.emit(GameEvents.INTERACT);
        if (control === 'dodge') EventBus.emit(GameEvents.DODGE);
        if (control === 'block') EventBus.emit(GameEvents.BLOCK_START);
        if (control === 'attack') attackGestureStart = { x: event.clientX, y: event.clientY };
      };

      const move = (event: PointerEvent) => {
        if (control !== 'attack' || !attackGestureStart) return;
        const direction = getAttackDirectionFromVector(
          event.clientX - attackGestureStart.x,
          event.clientY - attackGestureStart.y,
          this.attackDirection
        );
        EventBus.emit(GameEvents.ATTACK_DIRECTION, direction);
      };

      const end = (event: PointerEvent) => {
        event.preventDefault();
        if (control && control in this.touch) {
          this.touch[control as keyof TouchState] = false;
        }
        if (control === 'block') EventBus.emit(GameEvents.BLOCK_END);
        if (control === 'attack' && attackGestureStart) {
          const direction = getAttackDirectionFromVector(
            event.clientX - attackGestureStart.x,
            event.clientY - attackGestureStart.y,
            this.attackDirection
          );
          EventBus.emit(GameEvents.ATTACK, direction);
          attackGestureStart = undefined;
        }
      };

      button.addEventListener('pointerdown', start);
      button.addEventListener('pointermove', move);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('pointerleave', end);
      this.controlCleanup.push(() => {
        button.removeEventListener('pointerdown', start);
        button.removeEventListener('pointermove', move);
        button.removeEventListener('pointerup', end);
        button.removeEventListener('pointercancel', end);
        button.removeEventListener('pointerleave', end);
      });
    });

    EventBus.on(GameEvents.INTERACT, this.interact);
    EventBus.on(GameEvents.ATTACK, this.onAttackInput);
    EventBus.on(GameEvents.BLOCK_START, this.startBlock);
    EventBus.on(GameEvents.BLOCK_END, this.endBlock);
    EventBus.on(GameEvents.DODGE, this.dodge);
    EventBus.on(GameEvents.ATTACK_DIRECTION, this.onAttackDirection);
    EventBus.on(GameEvents.UI_READY, this.onUiReady);
  }

  private unbindControls(): void {
    this.controlCleanup.forEach((cleanup) => cleanup());
    this.controlCleanup = [];
    EventBus.off(GameEvents.INTERACT, this.interact);
    EventBus.off(GameEvents.ATTACK, this.onAttackInput);
    EventBus.off(GameEvents.BLOCK_START, this.startBlock);
    EventBus.off(GameEvents.BLOCK_END, this.endBlock);
    EventBus.off(GameEvents.DODGE, this.dodge);
    EventBus.off(GameEvents.ATTACK_DIRECTION, this.onAttackDirection);
    EventBus.off(GameEvents.UI_READY, this.onUiReady);
  }

  private onAttackInput = (direction?: AttackDirection): void => {
    this.attack(direction ?? this.attackDirection);
  };

  private onAttackDirection = (direction: AttackDirection): void => {
    this.setAttackDirection(direction, false);
  };

  private onUiReady = (): void => {
    this.emitHud();
  };

  private save(): void {
    this.saveSystem.save({
      player: { x: this.player.x, y: this.player.y, health: this.health, stamina: this.stamina },
      quest: this.quest
    });
  }

  private loadIfRequested(): void {
    if (!this.continueGame) return;
    const save = this.saveSystem.load();
    if (!save) return;
    this.player.setPosition(save.player.x, save.player.y);
    this.health = save.player.health;
    this.stamina = save.player.stamina;
    this.quest = save.quest;
    if (this.quest.banditDefeated) {
      this.bandit.disableBody(true, true);
      this.banditGuardIndicator.setVisible(false);
    }
  }
}
