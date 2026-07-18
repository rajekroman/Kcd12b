import { EventBus, GameEvents } from '../core/EventBus';

export class CoarseKeyboardFallbackController {
  private pendingFrame?: number;

  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.pendingFrame !== undefined) cancelAnimationFrame(this.pendingFrame);
    this.pendingFrame = undefined;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.repeat ||
      event.code !== 'Space' ||
      document.body.dataset.scene !== 'game' ||
      document.body.dataset.saveReady !== 'true' ||
      !this.isCoarsePointerDevice()
    ) {
      return;
    }

    event.preventDefault();
    const staminaBefore = document.body.dataset.stamina;
    if (this.pendingFrame !== undefined) cancelAnimationFrame(this.pendingFrame);

    this.pendingFrame = requestAnimationFrame(() => {
      this.pendingFrame = undefined;
      if (
        document.body.dataset.scene === 'game' &&
        document.body.dataset.saveReady === 'true' &&
        document.body.dataset.stamina === staminaBefore
      ) {
        EventBus.emit(GameEvents.ATTACK);
      }
    });
  };

  private isCoarsePointerDevice(): boolean {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }
}
