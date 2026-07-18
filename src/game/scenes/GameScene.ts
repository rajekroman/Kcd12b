import Phaser from 'phaser';
import { EventBus, GameEvents } from '../../core/EventBus';
import { calculateDamage } from '../../systems/CombatSystem';
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

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private smith!: Phaser.Physics.Arcade.Sprite;
  private bandit!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE', Phaser.Input.Keyboard.Key>;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private quest: QuestState = createInitialQuestState();
  private touch: TouchState = { up: false, down: false, left: false, right: false };
  private health = 100;
  private stamina = 100;
  private banditHealth = 55;
  private lastAttackAt = 0;
  private dialogueOpen = false;
  private dayClock = 0;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private saveSystem!: SaveSystem;
  private continueGame = false;
  private controlCleanup: Array<() => void> = [];

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.continueGame = Boolean(data.continueGame);
  }

  create(): void {
    document.body.classList.add('game-active');
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
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

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(2);

    this.cursors =
      this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D,E,SPACE') as Record<
      'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE',
      Phaser.Input.Keyboard.Key
    >;

    this.nightOverlay = this.add
      .rectangle(600, 400, 1200, 800, 0x08121e, 0)
      .setScrollFactor(0)
      .setDepth(90)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.bindControls();
    this.loadIfRequested();
    this.emitHud();

    this.time.addEvent({ delay: 10000, loop: true, callback: () => this.save() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unbindControls();
      document.body.classList.remove('game-active');
      if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    });
  }

  update(time: number, delta: number): void {
    if (this.dialogueOpen) {
      this.player.setVelocity(0);
      return;
    }

    this.updateMovement();
    this.updateBandit(time);
    this.updateDayNight(delta);

    if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) this.attack(time);
  }

  private createWorld(): void {
    for (let y = 0; y < 800; y += 16) {
      for (let x = 0; x < 1200; x += 16) {
        const onRoad = y > 340 && y < 430;
        this.add
          .image(x, y, onRoad ? 'road' : 'grass')
          .setOrigin(0)
          .setDepth(0);
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
    this.add.text(760, 325, 'VÝCHODNÍ CESTA', { fontSize: '8px', color: '#d6c294' }).setDepth(11);
  }

  private updateMovement(): void {
    const speed = 105;
    let x = 0;
    let y = 0;

    if (this.cursors.left?.isDown || this.wasd.A.isDown || this.touch.left) x -= 1;
    if (this.cursors.right?.isDown || this.wasd.D.isDown || this.touch.right) x += 1;
    if (this.cursors.up?.isDown || this.wasd.W.isDown || this.touch.up) y -= 1;
    if (this.cursors.down?.isDown || this.wasd.S.isDown || this.touch.down) y += 1;

    const direction = new Phaser.Math.Vector2(x, y).normalize().scale(speed);
    this.player.setVelocity(direction.x, direction.y);
    if (x !== 0) this.player.setFlipX(x < 0);
  }

  private updateBandit(time: number): void {
    if (!this.bandit.active || this.quest.step !== 'defeat-bandit') return;
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    if (distance < 170 && distance > 34) {
      this.physics.moveToObject(this.bandit, this.player, 58);
    } else {
      this.bandit.setVelocity(0);
    }

    if (distance <= 34 && time - this.lastAttackAt > 900) {
      this.lastAttackAt = time;
      this.health = Math.max(
        0,
        this.health -
          calculateDamage({
            baseDamage: 12,
            staminaRatio: 0.8,
            type: 'slash',
            armor: 'cloth'
          })
      );
      this.cameras.main.shake(90, 0.006);
      EventBus.emit(GameEvents.MESSAGE, 'Lapka tě zasáhl!');
      this.emitHud();
    }
  }

  private interact = (): void => {
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.smith);
    if (distance > 55) {
      EventBus.emit(GameEvents.MESSAGE, 'Nikdo není dost blízko.');
      return;
    }

    this.dialogueOpen = true;
    const firstMeeting = this.quest.step === 'meet-smith';
    EventBus.emit(GameEvents.DIALOGUE_OPEN, {
      speaker: 'Kovář Bohdan',
      text: firstMeeting
        ? 'Na východní cestě se usadil lapka. Vezmi tenhle meč a ukaž, že nejsi jen učedník.'
        : this.quest.step === 'complete'
          ? 'Dobrá práce. Ocel poslouchá toho, kdo nezaváhá.'
          : 'Lapka je stále na cestě. Drž si odstup a udeř ve správný okamžik.',
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

  private attack = (time = this.time.now): void => {
    if (time - this.lastAttackAt < 450 || this.stamina < 15) return;
    this.lastAttackAt = time;
    this.stamina -= 15;
    this.emitHud();

    this.tweens.add({
      targets: this.player,
      angle: this.player.flipX ? -20 : 20,
      yoyo: true,
      duration: 90
    });

    if (!this.bandit.active) return;
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.bandit);
    if (distance > 52) return;

    const damage = calculateDamage({
      baseDamage: 24,
      staminaRatio: this.stamina / 100,
      type: 'slash',
      armor: 'cloth',
      critical: distance < 30
    });
    this.banditHealth = Math.max(0, this.banditHealth - damage);
    this.bandit.setTintFill(0xffffff);
    this.time.delayedCall(80, () => this.bandit.clearTint());
    EventBus.emit(GameEvents.MESSAGE, `Zásah za ${damage}.`);

    if (this.banditHealth === 0) {
      this.bandit.disableBody(true, true);
      this.quest = advanceQuestAfterBanditDefeat(this.quest);
      EventBus.emit(GameEvents.MESSAGE, 'Lapka byl poražen. Úkol dokončen.');
      this.save();
    }
    this.emitHud();
  };

  private updateDayNight(delta: number): void {
    this.dayClock = (this.dayClock + delta / 1000) % 120;
    const phase = this.dayClock / 120;
    const darkness = Math.max(0, Math.sin((phase - 0.25) * Math.PI * 2)) * 0.52;
    this.nightOverlay.setAlpha(darkness);
    this.stamina = Math.min(100, this.stamina + delta * 0.012);
  }

  private emitHud(): void {
    EventBus.emit(GameEvents.HUD_UPDATE, {
      health: this.health,
      stamina: Math.round(this.stamina),
      objective: getQuestObjective(this.quest),
      banditHealth: this.bandit.active ? this.banditHealth : 0
    });
  }

  private bindControls(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      const start = (event: Event) => {
        event.preventDefault();
        if (control && control in this.touch) this.touch[control as keyof TouchState] = true;
        if (control === 'interact') EventBus.emit(GameEvents.INTERACT);
        if (control === 'attack') EventBus.emit(GameEvents.ATTACK);
      };
      const end = (event: Event) => {
        event.preventDefault();
        if (control && control in this.touch) this.touch[control as keyof TouchState] = false;
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('pointerleave', end);
      this.controlCleanup.push(() => {
        button.removeEventListener('pointerdown', start);
        button.removeEventListener('pointerup', end);
        button.removeEventListener('pointercancel', end);
        button.removeEventListener('pointerleave', end);
      });
    });
    EventBus.on(GameEvents.INTERACT, this.interact);
    EventBus.on(GameEvents.ATTACK, this.attack);
  }

  private unbindControls(): void {
    this.controlCleanup.forEach((cleanup) => cleanup());
    this.controlCleanup = [];
    EventBus.off(GameEvents.INTERACT, this.interact);
    EventBus.off(GameEvents.ATTACK, this.attack);
  }

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
    if (this.quest.banditDefeated) this.bandit.disableBody(true, true);
  }
}
