import type { QuestState } from './QuestSystem';

export interface GameSave {
  version: 1;
  player: { x: number; y: number; health: number; stamina: number };
  quest: QuestState;
  savedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_KEY = 'chronicles-of-bohemia.save.v1';

export class SaveSystem {
  constructor(private readonly storage: StorageLike) {}

  save(data: Omit<GameSave, 'version' | 'savedAt'>): GameSave {
    const payload: GameSave = {
      version: 1,
      ...data,
      savedAt: new Date().toISOString()
    };
    this.storage.setItem(SAVE_KEY, JSON.stringify(payload));
    return payload;
  }

  load(): GameSave | null {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<GameSave>;
      if (parsed.version !== 1 || !parsed.player || !parsed.quest || !parsed.savedAt) return null;
      return parsed as GameSave;
    } catch {
      return null;
    }
  }

  clear(): void {
    this.storage.removeItem(SAVE_KEY);
  }
}
