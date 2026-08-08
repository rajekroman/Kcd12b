import Phaser from "phaser";
import { HorseRuntimeOrchestrator } from "../../application/HorseRuntimeOrchestrator";
import {
  HorseEventIds,
  type HorseCommandRejected,
  type HorseRuntimeEvent,
} from "../../contracts/horseRuntime";
import { EventBus, GameEvents } from "../../core/EventBus";
import { firstHorseQuestContent } from "../../data/horseQuestContent";
import { HorseGameplayCoordinator } from "../../gameplay/HorseGameplayCoordinator";
import { HorseGameplayRuntime } from "../../gameplay/HorseGameplayRuntime";
import type { HorseMovementInput, HorseMovementState } from "../../gameplay/HorseMovementModel";
import { createInitialHorseRuntimeState } from "../../gameplay/HorseRuntimeState";
import { HorseRuntimeStorage } from "../../gameplay/HorseRuntimeStorage";
import { HorseSceneMovementAdapter } from "../controllers/HorseSceneMovementAdapter";
import { getHorseRejectionMessage, getHorseTrialResetMessage } from "../ui/HorseFeedback";
import { GameScene } from "./GameScene";

interface BaseSceneInternals {
  player: Phaser.Physics.Arcade.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: Record<"W" | "A" | "S" | "D" | "E" | "SPACE", Phaser.Input.Keyboard.Key>;
  dodgeKey: Phaser.Input.Keyboard.Key;
  obstacles: Phaser.Physics.Arcade.StaticGroup;
  touch: { up: boolean; down: boolean; left: boolean; right: boolean };
  dayClock: number;
  interact: () => void;
  dodge: (time?: number) => void;
  emitHud: () => void;
  initializeSaveState: () => Promise<void>;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

const ACTOR_ID = "player.henry";
const HORSE_HOME: Point = { x: 620, y: 350 };
const LAWFUL_GATE: Point = { x: 555, y: 330 };
const LAWFUL_HERBS: Point = { x: 500, y: 390 };
const OWNER_APPROVAL: Point = { x: 610, y: 295 };
const COVERT_GATE: Point = { x: 670, y: 330 };
const STABLE_HAZARD: Point = { x: 700, y: 260 };
const TRIAL_POINTS: readonly Point[] = [
  { x: 760, y: 350 },
  { x: 920, y: 430 },
  { x: 1040, y: 300 },
];
const INTERACTION_RADIUS = 28;
const CHECKPOINT_RADIUS = 30;
const ROUTE_BOUNDS = new Phaser.Geom.Rectangle(535, 215, 600, 375);

const distance = (a: Point, b: Point): number => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);

const isHorseCommandRejected = (value: unknown): value is HorseCommandRejected =>
  typeof value === "object" &&
  value !== null &&
  "accepted" in value &&
  (value as { accepted?: unknown }).accepted === false;

export class HorseGameScene extends GameScene {
  private horseRuntime!: HorseGameplayRuntime;
  private horseCoordinator!: HorseGameplayCoordinator;
  private horseMovement?: HorseSceneMovementAdapter;
  private horseReady = false;
  private horseVisual?: Phaser.GameObjects.Rectangle;
  private horseLabel?: Phaser.GameObjects.Text;
  private horseWorldPosition: Point = { ...HORSE_HOME };
  private mobileHorseSprint = false;
  private horseMovementState?: HorseMovementState;
  private horseEventCleanup?: () => void;
  private horseControlCleanup: Array<() => void> = [];
  private activeCheckpointZone: string | null = null;
  private producerBusy = false;
  private routeResetLatched = false;
  private covertFailureLatched = false;

  public override create(): void {
    this.createHorseRuntime();
    this.wrapBaseSceneLifecycle();
    super.create();
    this.createHorseWorldMarkers();
    this.bindHorseTouchSprint();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyHorseRuntime());
  }

  public override update(time: number, delta: number): void {
    super.update(time, delta);
    if (!this.horseReady || !this.horseMovement) return;

    const internals = this.internals();
    if (this.horseMovement.isAuthoritativeMountedActor()) {
      internals.player.setVelocity(0);
      const input = this.readHorseMovementInput();
      const movement = this.horseMovement.step(input, delta / 1000);
      internals.player.setVelocity(0);
      this.horseWorldPosition = { x: movement.x, y: movement.y };
      this.positionHorseVisual(movement.x, movement.y);
      void this.processTrialAndFailureProducers();
    } else {
      this.positionHorseVisual(this.horseWorldPosition.x, this.horseWorldPosition.y);
    }
    this.syncHorseDatasets();
  }

  private internals(): BaseSceneInternals {
    return this as unknown as BaseSceneInternals;
  }

  private createHorseRuntime(): void {
    this.horseRuntime = new HorseGameplayRuntime({
      orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
      persistence: new HorseRuntimeStorage(window.localStorage),
      initialState: createInitialHorseRuntimeState(firstHorseQuestContent),
      externalConditions: () => ({ "world.time.phase": this.getHorseTimePhase() }),
    });
    this.horseCoordinator = new HorseGameplayCoordinator({
      runtime: this.horseRuntime,
      content: firstHorseQuestContent,
      actorId: ACTOR_ID,
      nowTick: () => this.time?.now ?? 0,
    });
    this.horseEventCleanup = this.horseRuntime.subscribe((event) => this.onHorseEvent(event));
  }

  private wrapBaseSceneLifecycle(): void {
    const internals = this.internals();
    const baseInitialize = internals.initializeSaveState.bind(this);
    const baseInteract = internals.interact;
    const baseDodge = internals.dodge;
    const baseEmitHud = internals.emitHud.bind(this);

    internals.initializeSaveState = async () => {
      await baseInitialize();
      await this.initializeHorseRuntime();
    };
    internals.interact = () => {
      void this.handleHorseInteraction().then((handled) => {
        if (!handled) baseInteract();
      });
    };
    internals.dodge = (time = this.time.now) => {
      if (this.horseMovement?.isAuthoritativeMountedActor()) {
        this.mobileHorseSprint = true;
        this.time.delayedCall(260, () => {
          this.mobileHorseSprint = false;
        });
        return;
      }
      baseDodge(time);
    };
    internals.emitHud = () => {
      baseEmitHud();
      this.syncHorseDatasets();
    };
  }

  private async initializeHorseRuntime(): Promise<void> {
    await this.horseCoordinator.initialize();
    const internals = this.internals();
    if (this.horseCoordinator.getSnapshot().mountedActorId === ACTOR_ID) {
      this.horseWorldPosition = { x: internals.player.x, y: internals.player.y };
    }
    this.horseMovement = new HorseSceneMovementAdapter({
      runtime: this.horseRuntime,
      actorId: ACTOR_ID,
      host: {
        getPosition: () => ({ x: internals.player.x, y: internals.player.y }),
        setPosition: (x, y) => internals.player.setPosition(x, y),
        setMovementState: (state) => {
          this.horseMovementState = state;
          this.syncHorseDatasets();
        },
      },
      collision: { canOccupy: (x, y) => this.canHorseOccupy(x, y) },
    });
    this.horseReady = true;
    document.body.dataset.horseReady = "true";
    this.syncHorseDatasets();
  }

  private createHorseWorldMarkers(): void {
    this.horseVisual = this.add
      .rectangle(HORSE_HOME.x, HORSE_HOME.y, 20, 11, 0x8b5a2b)
      .setDepth(12)
      .setStrokeStyle(2, 0xe3c38b);
    this.horseLabel = this.add
      .text(HORSE_HOME.x, HORSE_HOME.y - 15, "JISKRA", {
        fontFamily: "monospace",
        fontSize: "7px",
        color: "#f1d5a5",
        backgroundColor: "#24170dcc",
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(13);

    const markers: Array<[Point, string, number]> = [
      [LAWFUL_GATE, "BRÁNA", 0x7b9c63],
      [LAWFUL_HERBS, "BYLINY", 0x6f9f72],
      [OWNER_APPROVAL, "ANEŽKA", 0xb89b72],
      [COVERT_GATE, "TAJNÁ BRÁNA", 0x66718f],
      [STABLE_HAZARD, "NEBEZPEČNÝ BOX", 0x8f4f48],
    ];
    for (const [point, label, color] of markers) {
      this.add.circle(point.x, point.y, 6, color, 0.55).setDepth(4);
      this.add
        .text(point.x, point.y - 12, label, { fontSize: "6px", color: "#e8d5ad" })
        .setOrigin(0.5)
        .setDepth(12);
    }
    TRIAL_POINTS.forEach((point, index) => {
      this.add.circle(point.x, point.y, 9, 0xc5a45a, 0.35).setDepth(3);
      this.add
        .text(point.x, point.y - 13, `CP${index + 1}`, { fontSize: "7px", color: "#f1d58c" })
        .setOrigin(0.5)
        .setDepth(12);
    });
  }

  private bindHorseTouchSprint(): void {
    const button = document.querySelector<HTMLButtonElement>('[data-control="dodge"]');
    if (!button) return;
    const start = () => {
      if (this.horseMovement?.isAuthoritativeMountedActor()) this.mobileHorseSprint = true;
    };
    const end = () => {
      this.mobileHorseSprint = false;
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("pointerleave", end);
    this.horseControlCleanup.push(() => {
      button.removeEventListener("pointerdown", start);
      button.removeEventListener("pointerup", end);
      button.removeEventListener("pointercancel", end);
      button.removeEventListener("pointerleave", end);
    });
  }

  private readHorseMovementInput(): HorseMovementInput {
    const internals = this.internals();
    let axisX = 0;
    let axisY = 0;
    if (internals.cursors.left?.isDown || internals.wasd.A.isDown || internals.touch.left) axisX -= 1;
    if (internals.cursors.right?.isDown || internals.wasd.D.isDown || internals.touch.right) axisX += 1;
    if (internals.cursors.up?.isDown || internals.wasd.W.isDown || internals.touch.up) axisY -= 1;
    if (internals.cursors.down?.isDown || internals.wasd.S.isDown || internals.touch.down) axisY += 1;
    return {
      axisX,
      axisY,
      sprint: internals.dodgeKey.isDown || this.mobileHorseSprint,
    };
  }

  private canHorseOccupy(x: number, y: number): boolean {
    if (x < 10 || x > 1190 || y < 10 || y > 790) return false;
    const candidate = new Phaser.Geom.Rectangle(x - 7, y - 7, 14, 14);
    return !this.internals().obstacles.getChildren().some((child) => {
      const bounds = (child as unknown as { getBounds(): Phaser.Geom.Rectangle }).getBounds();
      return Phaser.Geom.Intersects.RectangleToRectangle(candidate, bounds);
    });
  }

  private getHorseTimePhase(): "day" | "night" {
    const clock = this.internals().dayClock;
    return clock >= 30 && clock < 90 ? "night" : "day";
  }

  private near(point: Point, radius = INTERACTION_RADIUS): boolean {
    const player = this.internals().player;
    return distance({ x: player.x, y: player.y }, point) <= radius;
  }

  private async handleHorseInteraction(): Promise<boolean> {
    if (!this.horseReady || this.producerBusy) return false;
    const snapshot = this.horseCoordinator.getSnapshot();

    if (this.near(STABLE_HAZARD) && !snapshot.worldFlags["horse.jiskra.claimed"] && !snapshot.failed) {
      await this.runHorseAction(
        "failure-injury",
        this.horseCoordinator.reportFailure(
          "failure.first_horse.pre_claim_injury",
          "stable_hazard",
        ),
        "Jiskra se zranila v nebezpečném boxu.",
      );
      return true;
    }

    if (this.near(LAWFUL_GATE)) {
      if (!snapshot.worldFlags["horse.jiskra.trust_earned"]) return false;
      if (!snapshot.selectedSolution) await this.runHorseAction("select-lawful", this.horseCoordinator.selectSolution("lawful_service"));
      if (!this.horseCoordinator.getSnapshot().worldFlags["stable.radovesice.gate_repaired"]) {
        await this.runHorseAction("repair-gate", this.horseCoordinator.performInteraction("interaction.repair_stable_gate"));
      }
      return true;
    }

    if (this.near(LAWFUL_HERBS)) {
      if (snapshot.selectedSolution !== "lawful_service") return false;
      await this.runHorseAction("deliver-herbs", this.horseCoordinator.performInteraction("interaction.deliver_stable_herbs"));
      return true;
    }

    if (this.near(OWNER_APPROVAL)) {
      if (snapshot.selectedSolution !== "lawful_service") return false;
      await this.runHorseAction("owner-approval", this.horseCoordinator.performInteraction("interaction.obtain_owner_approval"));
      return true;
    }

    if (this.near(COVERT_GATE)) {
      if (!snapshot.worldFlags["horse.jiskra.trust_earned"]) return false;
      if (!snapshot.selectedSolution) await this.runHorseAction("select-covert", this.horseCoordinator.selectSolution("covert_release"));
      if (!this.horseCoordinator.getSnapshot().worldFlags["stable.radovesice.gate_opened_covertly"]) {
        await this.runHorseAction("open-covert-gate", this.horseCoordinator.performInteraction("interaction.open_stable_gate_covertly"));
      }
      return true;
    }

    const currentHorsePoint = this.horseCoordinator.getSnapshot().mountedActorId ?
      { x: this.internals().player.x, y: this.internals().player.y } : this.horseWorldPosition;
    if (distance({ x: this.internals().player.x, y: this.internals().player.y }, currentHorsePoint) > INTERACTION_RADIUS) {
      return false;
    }

    const current = this.horseCoordinator.getSnapshot();
    if (!current.worldFlags["horse.jiskra.inspected"]) {
      await this.runHorseAction("inspect", this.horseCoordinator.performInteraction("interaction.inspect_jiskra"));
    } else if (!current.worldFlags["horse.jiskra.fed"]) {
      await this.runHorseAction("feed", this.horseCoordinator.performInteraction("interaction.feed_jiskra"));
    } else if (!current.worldFlags["horse.jiskra.groomed"]) {
      await this.runHorseAction("groom", this.horseCoordinator.performInteraction("interaction.groom_jiskra"));
    } else if (
      current.selectedSolution === "covert_release" &&
      current.worldFlags["stable.radovesice.gate_opened_covertly"] &&
      !current.worldFlags["horse.jiskra.claimed"]
    ) {
      await this.runHorseAction("lead-out", this.horseCoordinator.performInteraction("interaction.lead_jiskra_out"));
    } else if (current.worldFlags["horse.jiskra.claimed"]) {
      const wasMounted = current.mountedActorId === ACTOR_ID;
      await this.runHorseAction(wasMounted ? "dismount" : "mount", this.horseCoordinator.toggleMount());
      const afterMount = this.horseCoordinator.getSnapshot();
      if (!wasMounted && afterMount.mountedActorId === ACTOR_ID && !afterMount.worldFlags["horse.jiskra.trial_completed"]) {
        await this.runHorseAction("start-trial", this.horseCoordinator.performInteraction("interaction.start_trial_ride"));
      }
    } else {
      EventBus.emit(GameEvents.MESSAGE, "Nejdřív zvol zákonnou nebo tajnou cestu získání Jiskry.");
    }
    return true;
  }

  private async runHorseAction(
    action: string,
    result: Promise<unknown>,
    message?: string,
  ): Promise<void> {
    this.producerBusy = true;
    document.body.dataset.horseAction = action;
    try {
      const outcome = await result;
      if (isHorseCommandRejected(outcome)) {
        const feedback = getHorseRejectionMessage(outcome.code);
        document.body.dataset.horseRejection = outcome.code;
        document.body.dataset.horseFeedback = feedback;
        EventBus.emit(GameEvents.MESSAGE, feedback);
        return;
      }
      delete document.body.dataset.horseRejection;
      if (message) {
        document.body.dataset.horseFeedback = message;
        EventBus.emit(GameEvents.MESSAGE, message);
      }
      this.syncHorseDatasets();
    } finally {
      this.producerBusy = false;
    }
  }

  private async processTrialAndFailureProducers(): Promise<void> {
    if (this.producerBusy) return;
    const snapshot = this.horseCoordinator.getSnapshot();
    const player = this.internals().player;

    if (
      snapshot.selectedSolution === "covert_release" &&
      !snapshot.worldFlags["horse.jiskra.claimed"] &&
      !snapshot.failed &&
      this.getHorseTimePhase() === "day" &&
      this.near(OWNER_APPROVAL, 45) &&
      !this.covertFailureLatched
    ) {
      this.covertFailureLatched = true;
      await this.runHorseAction(
        "failure-covert-detection",
        this.horseCoordinator.reportFailure(
          "failure.first_horse.covert_detection",
          "covert_detection",
        ),
        "Tajné odvedení bylo odhaleno.",
      );
      return;
    }

    if (!snapshot.worldFlags["horse.jiskra.trial_started"] || snapshot.completed) {
      this.activeCheckpointZone = null;
      this.routeResetLatched = false;
      return;
    }

    if (!ROUTE_BOUNDS.contains(player.x, player.y)) {
      if (!this.routeResetLatched) {
        this.routeResetLatched = true;
        await this.runHorseAction("trial-route-left", this.horseCoordinator.resetTrial("route_left"));
      }
      return;
    }
    this.routeResetLatched = false;

    const checkpointIndex = TRIAL_POINTS.findIndex(
      (point) => distance({ x: player.x, y: player.y }, point) <= CHECKPOINT_RADIUS,
    );
    if (checkpointIndex >= 0) {
      const checkpointId = firstHorseQuestContent.trialRoute.checkpointIds[checkpointIndex];
      if (this.activeCheckpointZone !== checkpointId) {
        this.activeCheckpointZone = checkpointId;
        await this.runHorseAction(
          `checkpoint-${checkpointIndex + 1}`,
          this.horseCoordinator.confirmCheckpoint(checkpointId, checkpointIndex),
        );
      }
      return;
    }
    this.activeCheckpointZone = null;

    const progress = snapshot.counters[firstHorseQuestContent.trialRoute.progressCounterId] ?? 0;
    if (progress >= TRIAL_POINTS.length && this.near(HORSE_HOME, 40)) {
      await this.runHorseAction(
        "finish-trial",
        this.horseCoordinator.performInteraction("interaction.finish_trial_ride"),
        "Zkušební jízda dokončena.",
      );
    }
  }

  private onHorseEvent(event: HorseRuntimeEvent): void {
    document.body.dataset.horseLastEvent = event.id;
    delete document.body.dataset.horseRejection;
    if (event.id === HorseEventIds.mountConfirmed) {
      const player = this.internals().player;
      this.horseWorldPosition = { x: player.x, y: player.y };
    }
    if (event.id === HorseEventIds.dismountConfirmed) {
      const player = this.internals().player;
      this.horseWorldPosition = { x: player.x, y: player.y };
    }
    if (event.id === HorseEventIds.trialResetConfirmed) {
      const feedback = getHorseTrialResetMessage(event.reason);
      document.body.dataset.horseFeedback = feedback;
      EventBus.emit(GameEvents.MESSAGE, feedback);
    }
    this.syncHorseDatasets();
  }

  private positionHorseVisual(x: number, y: number): void {
    this.horseVisual?.setPosition(x, y);
    this.horseLabel?.setPosition(x, y - 15);
  }

  private syncHorseDatasets(): void {
    if (!this.horseRuntime) return;
    const snapshot = this.horseRuntime.getSnapshot();
    document.body.dataset.horseReady = this.horseReady ? "true" : "false";
    document.body.dataset.horseMounted = snapshot.mountedActorId ?? "";
    document.body.dataset.horseSolution = snapshot.selectedSolution ?? "";
    document.body.dataset.horseClaimed = String(Boolean(snapshot.worldFlags["horse.jiskra.claimed"]));
    document.body.dataset.horseTrialActive = String(Boolean(snapshot.worldFlags["horse.jiskra.trial_started"]));
    document.body.dataset.horseTrialIndex = String(
      snapshot.counters[firstHorseQuestContent.trialRoute.progressCounterId] ?? 0,
    );
    document.body.dataset.horseCompleted = String(snapshot.completed);
    document.body.dataset.horseFailed = String(snapshot.failed);
    document.body.dataset.horseGait = this.horseMovementState?.gait ?? "idle";
    document.body.dataset.horseStamina = String(Math.round(this.horseMovementState?.stamina ?? 100));
  }

  private destroyHorseRuntime(): void {
    this.horseEventCleanup?.();
    this.horseEventCleanup = undefined;
    this.horseControlCleanup.forEach((cleanup) => cleanup());
    this.horseControlCleanup = [];
    delete document.body.dataset.horseReady;
    delete document.body.dataset.horseMounted;
    delete document.body.dataset.horseSolution;
    delete document.body.dataset.horseClaimed;
    delete document.body.dataset.horseTrialActive;
    delete document.body.dataset.horseTrialIndex;
    delete document.body.dataset.horseCompleted;
    delete document.body.dataset.horseFailed;
    delete document.body.dataset.horseGait;
    delete document.body.dataset.horseStamina;
    delete document.body.dataset.horseAction;
    delete document.body.dataset.horseLastEvent;
    delete document.body.dataset.horseRejection;
    delete document.body.dataset.horseFeedback;
  }
}
