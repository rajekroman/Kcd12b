import { describe, expect, it } from 'vitest';
import {
  CURRENT_SAVE_VERSION,
  FALLBACK_SAVE_KEY,
  LEGACY_SAVE_KEY,
  SaveSystem,
  migrateGameSave,
  type AsyncSaveStore,
  type GameSave,
  type StorageLike
} from '../systems/SaveSystem';
import { createInitialQuestState } from '../systems/QuestSystem';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

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

class MemoryAsyncStore implements AsyncSaveStore {
  value: unknown | null = null;
  getFailures = 0;
  setFailures = 0;
  deleteFailures = 0;

  async get(): Promise<unknown | null> {
    if (this.getFailures > 0) {
      this.getFailures -= 1;
      throw new Error('read failed');
    }
    return this.value;
  }

  async set(value: GameSave): Promise<void> {
    if (this.setFailures > 0) {
      this.setFailures -= 1;
      throw new Error('write failed');
    }
    this.value = value;
  }

  async delete(): Promise<void> {
    if (this.deleteFailures > 0) {
      this.deleteFailures -= 1;
      throw new Error('delete failed');
    }
    this.value = null;
  }
}

const input = {
  player: { x: 12, y: 34, health: 90, stamina: 55 },
  quest: createInitialQuestState(),
  world: { dayClock: 27 }
};

const fixedNow = () => new Date('2026-07-18T08:00:00.000Z');

describe('SaveSystem', () => {
  it('uloží, načte a smaže stav v primárním async úložišti', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });

    const stored = await saves.save(input);

    expect(stored.version).toBe(CURRENT_SAVE_VERSION);
    expect(stored.savedAt).toBe('2026-07-18T08:00:00.000Z');
    expect((await saves.load())?.player.x).toBe(12);
    expect(fallback.getItem(FALLBACK_SAVE_KEY)).toBeNull();

    await saves.clear();
    expect(await saves.load()).toBeNull();
  });

  it('migruje legacy localStorage verzi 1 do IndexedDB verze 2', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(
      LEGACY_SAVE_KEY,
      JSON.stringify({
        version: 1,
        player: input.player,
        quest: input.quest,
        savedAt: '2026-07-17T20:00:00.000Z'
      })
    );
    const saves = new SaveSystem({ primary, fallback });

    const migrated = await saves.load();

    expect(migrated?.version).toBe(2);
    expect(migrated?.world.dayClock).toBe(0);
    expect((primary.value as GameSave).version).toBe(2);
    expect(fallback.getItem(LEGACY_SAVE_KEY)).toBeNull();
  });

  it('použije fallback, když primární úložiště selže', async () => {
    const primary = new MemoryAsyncStore();
    primary.setFailures = 1;
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });

    await saves.save(input);

    const raw = fallback.getItem(FALLBACK_SAVE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}').version).toBe(2);
    expect((await saves.load())?.world.dayClock).toBe(27);
  });

  it('načte fallback po selhání čtení primárního úložiště', async () => {
    const primary = new MemoryAsyncStore();
    primary.getFailures = 1;
    const fallback = new MemoryStorage();
    fallback.setItem(
      FALLBACK_SAVE_KEY,
      JSON.stringify({
        version: 2,
        ...input,
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
    const saves = new SaveSystem({ primary, fallback });

    expect((await saves.load())?.player.y).toBe(34);
  });

  it('bezpečně odmítne poškozená a nekompletní data', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(FALLBACK_SAVE_KEY, '{broken');
    const saves = new SaveSystem({ primary, fallback });

    expect(await saves.load()).toBeNull();
    expect(migrateGameSave({ version: 2 })).toBeNull();
    expect(migrateGameSave(null)).toBeNull();
  });
});
