import { changeReputation } from '../core/ReputationStore';
import { EventBus, GameEvents } from '../core/EventBus';
import { subscribeQuestCompleted } from '../systems/QuestSystem';
import { FIRST_STEEL_REPUTATION_REWARD } from '../systems/ReputationSystem';

export class ReputationController {
  private readonly unsubscribe: () => void;

  constructor() {
    this.unsubscribe = subscribeQuestCompleted((completed) => {
      if (completed.id !== 'first-steel') return;

      changeReputation(FIRST_STEEL_REPUTATION_REWARD);
      EventBus.emit(
        GameEvents.MESSAGE,
        'Pověst vzrostla: sedláci +15, měšťané +8, šlechta +2.'
      );
      EventBus.emit(GameEvents.ECONOMY_CHANGED);
    });
  }

  destroy(): void {
    this.unsubscribe();
  }
}
