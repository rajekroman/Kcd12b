import type { HorseGameplayRuntime } from '../../gameplay/HorseGameplayRuntime';
import {
  createInitialHorseMovementState,
  stepHorseMovement,
  type HorseCollisionProbe,
  type HorseMovementConfig,
  type HorseMovementInput,
  type HorseMovementState
} from '../../gameplay/HorseMovementModel';

export interface HorseSceneMovementHost {
  getPosition(): Readonly<{ x: number; y: number }>;
  setPosition(x: number, y: number): void;
  setMovementState(state: HorseMovementState): void;
}

export interface HorseSceneMovementAdapterOptions {
  readonly runtime: HorseGameplayRuntime;
  readonly actorId: string;
  readonly host: HorseSceneMovementHost;
  readonly collision: HorseCollisionProbe;
  readonly config?: HorseMovementConfig;
}

/**
 * Scene-facing adapter that gates movement through the authoritative mount owner.
 * It never mutates horse quest state and only applies the pure movement result to
 * the scene host when the configured actor owns the current mount.
 */
export class HorseSceneMovementAdapter {
  private movement: HorseMovementState;

  public constructor(private readonly options: HorseSceneMovementAdapterOptions) {
    const position = options.host.getPosition();
    this.movement = createInitialHorseMovementState(
      position.x,
      position.y,
      options.config
    );
    options.host.setMovementState(this.movement);
  }

  public getMovementState(): HorseMovementState {
    return this.movement;
  }

  public isAuthoritativeMountedActor(): boolean {
    return this.options.runtime.getSnapshot().mountedActorId === this.options.actorId;
  }

  public step(input: HorseMovementInput, deltaSeconds: number): HorseMovementState {
    if (!this.isAuthoritativeMountedActor()) {
      const position = this.options.host.getPosition();
      this.movement = {
        ...this.movement,
        x: position.x,
        y: position.y,
        gait: 'idle'
      };
      this.options.host.setMovementState(this.movement);
      return this.movement;
    }

    const position = this.options.host.getPosition();
    const current = {
      ...this.movement,
      x: position.x,
      y: position.y
    };
    const next = stepHorseMovement(
      current,
      input,
      deltaSeconds,
      this.options.collision,
      this.options.config
    );

    this.movement = next;
    this.options.host.setPosition(next.x, next.y);
    this.options.host.setMovementState(next);
    return next;
  }
}
