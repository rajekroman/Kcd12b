import { EventBus, GameEvents } from '../core/EventBus';
import type { AttackDirection } from '../systems/CombatSystem';

interface InputSnapshot {
  stamina: string | undefined;
  dialogueId: string | undefined;
  lastMessage: string | undefined;
  attackDirection: string | undefined;
  dodgeReady: string | undefined;
}

const DIRECTION_KEYS: Partial<Record<string, AttackDirection>> = {
  Digit1: 'high',
  Digit2: 'left',
  Digit3: 'right',
  Digit4: 'low-left',
  Digit5: 'low-right'
};

export class KeyboardInputFallbackController {
  private readonly pendingFrames = new Map<string, number>();

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    this.pendingFrames.forEach((frame) => cancelAnimationFrame(frame));
    this.pendingFrames.clear();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.repeat ||
      document.body.dataset.scene !== 'game' ||
      document.body.dataset.saveReady !== 'true' ||
      !this.isSupportedCode(event.code) ||
      this.isFormControl(event.target)
    ) {
      return;
    }

    if (event.code === 'Space') event.preventDefault();
    const before = this.captureSnapshot();
    const previousFrame = this.pendingFrames.get(event.code);
    if (previousFrame !== undefined) cancelAnimationFrame(previousFrame);

    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => {
        this.pendingFrames.delete(event.code);
        if (!this.isGameReady()) return;
        this.emitFallbackIfMissed(event.code, before, this.captureSnapshot());
      });
      this.pendingFrames.set(event.code, secondFrame);
    });
    this.pendingFrames.set(event.code, firstFrame);
  };

  private emitFallbackIfMissed(code: string, before: InputSnapshot, after: InputSnapshot): void {
    if (code === 'Space') {
      if (after.stamina === before.stamina) EventBus.emit(GameEvents.ATTACK);
      return;
    }

    if (code === 'KeyE') {
      if (after.dialogueId === before.dialogueId && after.lastMessage === before.lastMessage) {
        EventBus.emit(GameEvents.INTERACT);
      }
      return;
    }

    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (
        before.dodgeReady === 'true' &&
        after.dodgeReady === before.dodgeReady &&
        after.stamina === before.stamina &&
        after.lastMessage === before.lastMessage
      ) {
        EventBus.emit(GameEvents.DODGE);
      }
      return;
    }

    const direction = DIRECTION_KEYS[code];
    if (direction && after.attackDirection === before.attackDirection) {
      EventBus.emit(GameEvents.ATTACK_DIRECTION, direction);
    }
  }

  private captureSnapshot(): InputSnapshot {
    return {
      stamina: document.body.dataset.stamina,
      dialogueId: document.body.dataset.dialogueId,
      lastMessage: document.body.dataset.lastMessage,
      attackDirection: document.body.dataset.attackDirection,
      dodgeReady: document.body.dataset.dodgeReady
    };
  }

  private isSupportedCode(code: string): boolean {
    return (
      code === 'Space' ||
      code === 'KeyE' ||
      code === 'ShiftLeft' ||
      code === 'ShiftRight' ||
      code in DIRECTION_KEYS
    );
  }

  private isGameReady(): boolean {
    return (
      document.body.dataset.scene === 'game' &&
      document.body.dataset.saveReady === 'true'
    );
  }

  private isFormControl(target: EventTarget | null): boolean {
    return target instanceof HTMLElement &&
      target.matches('button, input, textarea, select, [contenteditable="true"]');
  }
}
