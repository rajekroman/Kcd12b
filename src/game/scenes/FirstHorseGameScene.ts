import Phaser from "phaser";
import { EventBus, GameEvents } from "../../core/EventBus";
import type { HorseGameplayCoordinator } from "../../gameplay/HorseGameplayCoordinator";
import { HorseGameScene } from "./HorseGameScene";

interface HorseSceneInternals {
  interact: () => void;
  horseReady: boolean;
  producerBusy: boolean;
  horseCoordinator: HorseGameplayCoordinator;
  runHorseAction(action: string, result: Promise<unknown>, message?: string): Promise<void>;
  player: Phaser.Physics.Arcade.Sprite;
  dayClock: number;
}

const ACTOR_ID = "player.henry";
const OWNER_APPROVAL = { x: 610, y: 295 };

export class FirstHorseGameScene extends HorseGameScene {
  private covertDetectionLatched = false;
  private replacementInteract?: () => void;

  public override create(): void {
    super.create();
    this.installTrialRestartInteraction();
  }

  public override update(time: number, delta: number): void {
    super.update(time, delta);
    this.produceCovertDetectionFailure();
  }

  private horseInternals(): HorseSceneInternals {
    return this as unknown as HorseSceneInternals;
  }

  private installTrialRestartInteraction(): void {
    const internals = this.horseInternals();
    const previousInteract = internals.interact;
    const replacement = () => {
      const snapshot = internals.horseCoordinator.getSnapshot();
      if (
        internals.horseReady &&
        !internals.producerBusy &&
        snapshot.mountedActorId === ACTOR_ID &&
        !snapshot.worldFlags["horse.jiskra.trial_started"] &&
        !snapshot.worldFlags["horse.jiskra.trial_completed"]
      ) {
        void internals.runHorseAction(
          "restart-trial",
          internals.horseCoordinator.performInteraction("interaction.start_trial_ride"),
        );
        return;
      }
      previousInteract();
    };

    EventBus.off(GameEvents.INTERACT, previousInteract);
    internals.interact = replacement;
    EventBus.on(GameEvents.INTERACT, replacement);
    this.replacementInteract = replacement;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.replacementInteract) {
        EventBus.off(GameEvents.INTERACT, this.replacementInteract);
        this.replacementInteract = undefined;
      }
    });
  }

  private produceCovertDetectionFailure(): void {
    const internals = this.horseInternals();
    if (!internals.horseReady || internals.producerBusy || this.covertDetectionLatched) return;

    const snapshot = internals.horseCoordinator.getSnapshot();
    const isDay = internals.dayClock < 30 || internals.dayClock >= 90;
    const nearOwner = Phaser.Math.Distance.Between(
      internals.player.x,
      internals.player.y,
      OWNER_APPROVAL.x,
      OWNER_APPROVAL.y,
    ) <= 45;

    if (
      snapshot.selectedSolution !== "covert_release" ||
      snapshot.worldFlags["horse.jiskra.claimed"] ||
      snapshot.failed ||
      !isDay ||
      !nearOwner
    ) {
      return;
    }

    this.covertDetectionLatched = true;
    void internals.runHorseAction(
      "failure-covert-detection",
      internals.horseCoordinator.reportFailure(
        "failure.first_horse.covert_detection",
        "covert_detection",
      ),
      "Tajné odvedení bylo odhaleno.",
    );
  }
}
