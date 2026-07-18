import { describe, expect, it } from 'vitest';
import { SaveSystem, type StorageLike } from '../systems/SaveSystem';
import { createInitialQuestState } from '../systems/QuestSystem';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('SaveSystem', () => {
  it('uloží, načte a smaže stav hry', () => {
    const storage = new MemoryStorage();
    const saves = new SaveSystem(storage);
    saves.save({
      player: { x: 12, y: 34, health: 90, stamina: 55 },
      quest: createInitialQuestState()
    });

    expect(saves.load()?.player.x).toBe(12);
    saves.clear();
    expect(saves.load()).toBeNull();
  });

  it('bezpečně odmítne poškozená data', () => {
    const storage = new MemoryStorage();
    storage.setItem('chronicles-of-bohemia.save.v1', '{broken');
    expect(new SaveSystem(storage).load()).toBeNull();
  });
});
