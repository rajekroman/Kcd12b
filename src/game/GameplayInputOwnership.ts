export interface GameplayResumeContext {
  scene: string | undefined;
  economyOpen: boolean;
  blockingModalVisible: boolean;
}

export function shouldResumeGameplayInput(context: GameplayResumeContext): boolean {
  return context.scene === 'game' && !context.economyOpen && !context.blockingModalVisible;
}
