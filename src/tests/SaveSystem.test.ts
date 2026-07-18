import { describe, expect, it } from 'vitest';
import { createInitialEconomyState } from '../systems/InventorySystem';
import {
  CURRENT_SAVE_VERSION,
  FALLBACK_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_SAVE_KEY_V2,
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

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('fallback read failed');
  }

  setItem(): void {
    throw new Error('fallback write failed');
  }

  removeItem(): void {
    throw new Error('fallback delete failed');
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
  world: { dayClock: 27 },
  economy: createInitialEconomyState()
};

const fixedNow = () => new Date('2026-07-18T08:00:00.000Z');

describe('SaveSystem', () => {
  it('uloží, načte a smaže stav verze 3 v primárním async úložišti', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });

    const stored = await saves.save(input);

    expect(stored.version).toBe(CURRENT_SAVE_VERSION);
    expect(stored.savedAt).toBe('2026-07-18T08:00:00.000Z');
    expect(stored.economy.inventory.equipment.weapon).toBe('bohdan-sword');
    expect((await saves.load())?.player.x).toBe(12);
    expect(fallback.getItem(FALLBACK_SAVE_KEY)).toBeNull();

    await saves.clear();
    expect(await saves.load()).toBeNull();
  });

  it('migruje legacy verzi 1 na verzi 3 s výchozí ekonomikou', async () => {
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

    expect(migrated?.version).toBe(3);
    expect(migrated?.world.dayClock).toBe(0);
    expect(migrated?.economy.inventory.groschen).toBe(85);
    expect((primary.value as GameSave).version).toBe(3);
    expect(fallback.getItem(LEGACY_SAVE_KEY)).toBeNull();
  });

  it('migruje verzi 2 a zachová světový čas', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(
      LEGACY_SAVE_KEY_V2,
      JSON.stringify({
        version: 2,
        player: input.player,
        quest: input.quest,
        world: { dayClock: 61 },
        savedAt: '2026-07-18T07:00:00.000Z'
      })
    );
    const saves = new SaveSystem({ primary, fallback });

    const migrated = await saves.load();

    expect(migrated?.version).toBe(3);
    expect(migrated?.world.dayClock).toBe(61);
    expect(migrated?.economy.merchant.stock.length).toBeGreaterThan(0);
    expect(fallback.getItem(LEGACY_SAVE_KEY_V2)).toBeNull();
  });

  it('použije fallback verze 3, když primární úložiště selže', async () => {
    const primary = new MemoryAsyncStore();
    primary.setFailures = 1;
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });

    await saves.save(input);

    const raw = fallback.getItem(FALLBACK_SAVE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}').version).toBe(3);
    expect((await saves.load())?.world.dayClock).toBe(27);
  });

  it('načte fallback po selhání čtení primárního úložiště', async () => {
    const primary = new MemoryAsyncStore();
    primary.getFailures = 1;
    const fallback = new MemoryStorage();
    fallback.setItem(
      FALLBACK_SAVE_KEY,
      JSON.stringify({
        version: 3,
        ...input,
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
    const saves = new SaveSystem({ primary, fallback });

    expect((await saves.load())?.player.y).toBe(34);
  });

  it('neplatný primární záznam nezakryje platný fallback', async () => {
    const primary = new MemoryAsyncStore();
    primary.value = { version: 3, player: null };
    const fallback = new MemoryStorage();
    fallback.setItem(
      FALLBACK_SAVE_KEY,
      JSON.stringify({
        version: 3,
        ...input,
        savedAt: '2026-07-18T08:00:00.000Z'
      })
    );
    const saves = new SaveSystem({ primary, fallback });

    expect((await saves.load())?.player.health).toBe(90);
    expect((primary.value as GameSave).economy.inventory.groschen).toBe(85);
  });

  it('odmítne neplatné ekonomické vybavení', () => {
    const invalid = {
      version: 3,
      ...input,
      economy: {
        ...input.economy,
        inventory: {
          ...input.economy.inventory,
          equipment: { weapon: 'bread', armor: null, accessory: null }
        }
      },
      savedAt: '2026-07-18T08:00:00.000Z'
    };

    expect(migrateGameSave(invalid)).toBeNull();
  });

  it('ohlásí chybu, když nelze zapisovat do žádného úložiště', async () => {
    const primary = new MemoryAsyncStore();
    primary.setFailures = 1;
    const saves = new SaveSystem({ primary, fallback: new ThrowingStorage(), now: fixedNow });

    await expect(saves.save(input)).rejects.toThrow('Save could not be written');
  });

  it('bezpečně odmítne poškozená a nekompletní data', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(FALLBACK_SAVE_KEY, '{broken');
    const saves = new SaveSystem({ primary, fallback });

    expect(await saves.load()).toBeNull();
    expect(migrateGameSave({ version: 3 })).toBeNull();
    expect(migrateGameSave(null)).toBeNull();
  });
});
