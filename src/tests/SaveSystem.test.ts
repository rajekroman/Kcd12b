import { beforeEach, describe, expect, it } from 'vitest';
import { getHuntedAnimals, resetHuntedAnimals, setHuntedAnimals } from '../core/FaunaStore';
import { createInitialEconomyState } from '../systems/InventorySystem';
import { createInitialReputationState } from '../systems/ReputationSystem';
import {
  CURRENT_SAVE_VERSION,
  FALLBACK_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_SAVE_KEY_V2,
  LEGACY_SAVE_KEY_V3,
  LEGACY_SAVE_KEY_V4,
  SaveSystem,
  migrateGameSave,
  type AsyncSaveStore,
  type GameSave,
  type StorageLike
} from '../systems/SaveSystem';
import { createInitialQuestState } from '../systems/QuestSystem';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null { throw new Error('fallback read failed'); }
  setItem(): void { throw new Error('fallback write failed'); }
  removeItem(): void { throw new Error('fallback delete failed'); }
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
  economy: createInitialEconomyState(),
  reputation: { peasants: 12, townsfolk: -4, nobility: 3 }
};

const fixedNow = () => new Date('2026-07-18T08:00:00.000Z');

beforeEach(() => {
  resetHuntedAnimals();
});

describe('SaveSystem', () => {
  it('uloží, načte a smaže stav verze 5 v primárním async úložišti', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });
    setHuntedAnimals(['hare-north']);

    const stored = await saves.save(input);

    expect(stored.version).toBe(CURRENT_SAVE_VERSION);
    expect(stored.savedAt).toBe('2026-07-18T08:00:00.000Z');
    expect(stored.world.huntedAnimals).toEqual(['hare-north']);
    expect(stored.economy.inventory.equipment.weapon).toBe('bohdan-sword');
    expect(stored.reputation).toEqual(input.reputation);
    expect((await saves.load())?.player.x).toBe(12);
    expect(getHuntedAnimals()).toEqual(['hare-north']);
    expect(fallback.getItem(FALLBACK_SAVE_KEY)).toBeNull();

    await saves.clear();
    expect(await saves.load()).toBeNull();
    expect(getHuntedAnimals()).toEqual([]);
  });

  it('migruje legacy verzi 1 na verzi 5 s prázdnou faunou', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(LEGACY_SAVE_KEY, JSON.stringify({
      version: 1,
      player: input.player,
      quest: input.quest,
      savedAt: '2026-07-17T20:00:00.000Z'
    }));
    const migrated = await new SaveSystem({ primary, fallback }).load();

    expect(migrated?.version).toBe(5);
    expect(migrated?.world).toEqual({ dayClock: 0, huntedAnimals: [] });
    expect(migrated?.economy.inventory.groschen).toBe(85);
    expect(migrated?.reputation).toEqual(createInitialReputationState());
    expect((primary.value as GameSave).version).toBe(5);
    expect(fallback.getItem(LEGACY_SAVE_KEY)).toBeNull();
  });

  it('migruje verzi 2 a zachová světový čas', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(LEGACY_SAVE_KEY_V2, JSON.stringify({
      version: 2,
      player: input.player,
      quest: input.quest,
      world: { dayClock: 61 },
      savedAt: '2026-07-18T07:00:00.000Z'
    }));
    const migrated = await new SaveSystem({ primary, fallback }).load();

    expect(migrated?.version).toBe(5);
    expect(migrated?.world).toEqual({ dayClock: 61, huntedAnimals: [] });
    expect(migrated?.economy.merchant.stock.length).toBeGreaterThan(0);
    expect(fallback.getItem(LEGACY_SAVE_KEY_V2)).toBeNull();
  });

  it('migruje verzi 3 bez ztráty ekonomiky', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(LEGACY_SAVE_KEY_V3, JSON.stringify({
      version: 3,
      player: input.player,
      quest: input.quest,
      world: input.world,
      economy: input.economy,
      savedAt: '2026-07-18T07:30:00.000Z'
    }));
    const migrated = await new SaveSystem({ primary, fallback }).load();

    expect(migrated?.version).toBe(5);
    expect(migrated?.economy).toEqual(input.economy);
    expect(migrated?.reputation).toEqual(createInitialReputationState());
  });

  it('migruje verzi 4 a přidá prázdný seznam ulovené zvěře', async () => {
    const primary = new MemoryAsyncStore();
    const fallback = new MemoryStorage();
    fallback.setItem(LEGACY_SAVE_KEY_V4, JSON.stringify({
      version: 4,
      ...input,
      savedAt: '2026-07-18T07:45:00.000Z'
    }));
    const migrated = await new SaveSystem({ primary, fallback }).load();

    expect(migrated?.version).toBe(5);
    expect(migrated?.world).toEqual({ dayClock: 27, huntedAnimals: [] });
    expect(fallback.getItem(LEGACY_SAVE_KEY_V4)).toBeNull();
  });

  it('použije fallback verze 5, když primární úložiště selže', async () => {
    const primary = new MemoryAsyncStore();
    primary.setFailures = 1;
    const fallback = new MemoryStorage();
    const saves = new SaveSystem({ primary, fallback, now: fixedNow });
    setHuntedAnimals(['boar-south']);

    await saves.save(input);
    const raw = fallback.getItem(FALLBACK_SAVE_KEY);

    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}').version).toBe(5);
    expect(JSON.parse(raw ?? '{}').world.huntedAnimals).toEqual(['boar-south']);
  });

  it('načte fallback po selhání čtení primárního úložiště', async () => {
    const primary = new MemoryAsyncStore();
    primary.getFailures = 1;
    const fallback = new MemoryStorage();
    fallback.setItem(FALLBACK_SAVE_KEY, JSON.stringify({
      version: 5,
      ...input,
      world: { dayClock: 27, huntedAnimals: ['roe-east'] },
      savedAt: '2026-07-18T08:00:00.000Z'
    }));
    const saves = new SaveSystem({ primary, fallback });

    expect((await saves.load())?.player.y).toBe(34);
    expect(getHuntedAnimals()).toEqual(['roe-east']);
  });

  it('neplatný primární záznam nezakryje platný fallback', async () => {
    const primary = new MemoryAsyncStore();
    primary.value = { version: 5, player: null };
    const fallback = new MemoryStorage();
    fallback.setItem(FALLBACK_SAVE_KEY, JSON.stringify({
      version: 5,
      ...input,
      world: { dayClock: 27, huntedAnimals: [] },
      savedAt: '2026-07-18T08:00:00.000Z'
    }));
    const saves = new SaveSystem({ primary, fallback });

    expect((await saves.load())?.player.health).toBe(90);
    expect((primary.value as GameSave).reputation.townsfolk).toBe(-4);
  });

  it('odmítne neplatné nebo duplicitní ID ulovené zvěře', () => {
    const base = {
      version: 5,
      ...input,
      savedAt: '2026-07-18T08:00:00.000Z'
    };
    expect(migrateGameSave({ ...base, world: { dayClock: 27, huntedAnimals: ['wolf'] } })).toBeNull();
    expect(migrateGameSave({
      ...base,
      world: { dayClock: 27, huntedAnimals: ['hare-north', 'hare-north'] }
    })).toBeNull();
  });

  it('odmítne neplatnou pověst a ekonomické vybavení', () => {
    const base = {
      version: 5,
      ...input,
      world: { dayClock: 27, huntedAnimals: [] },
      savedAt: '2026-07-18T08:00:00.000Z'
    };
    expect(migrateGameSave({
      ...base,
      reputation: { peasants: 101, townsfolk: 0, nobility: 0 }
    })).toBeNull();
    expect(migrateGameSave({
      ...base,
      economy: {
        ...input.economy,
        inventory: {
          ...input.economy.inventory,
          equipment: { weapon: 'bread', armor: null, accessory: null }
        }
      }
    })).toBeNull();
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
    expect(migrateGameSave({ version: 5 })).toBeNull();
    expect(migrateGameSave(null)).toBeNull();
  });
});
