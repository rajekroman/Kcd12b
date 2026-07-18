import {
  getEconomyState,
  resetEconomyState,
  setEconomyState
} from '../core/EconomyStore';
import {
  getReputationState,
  resetReputationState,
  setReputationState
} from '../core/ReputationStore';
import { ITEM_DEFINITIONS, type EquipmentSlot, type ItemId } from '../data/items';
import {
  createInitialEconomyState,
  getItemQuantity,
  type EconomyState,
  type EquipmentState,
  type InventoryStack,
  type InventoryState,
  type MerchantState
} from './InventorySystem';
import type { QuestState } from './QuestSystem';
import {
  MAX_REPUTATION,
  MIN_REPUTATION,
  createInitialReputationState,
  type ReputationState
} from './ReputationSystem';

export interface PlayerSaveState {
  x: number;
  y: number;
  health: number;
  stamina: number;
}

export interface WorldSaveState {
  dayClock: number;
}

export interface GameSave {
  version: 4;
  player: PlayerSaveState;
  quest: QuestState;
  world: WorldSaveState;
  economy: EconomyState;
  reputation: ReputationState;
  savedAt: string;
}

export type GameSaveInput = Omit<
  GameSave,
  'version' | 'savedAt' | 'economy' | 'reputation'
> & {
  economy?: EconomyState;
  reputation?: ReputationState;
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AsyncSaveStore {
  get(): Promise<unknown | null>;
  set(value: GameSave): Promise<void>;
  delete(): Promise<void>;
}

export interface SaveSystemOptions {
  primary: AsyncSaveStore;
  fallback: StorageLike;
  now?: () => Date;
}

export const CURRENT_SAVE_VERSION = 4;
export const LEGACY_SAVE_KEY = 'chronicles-of-bohemia.save.v1';
export const LEGACY_SAVE_KEY_V2 = 'chronicles-of-bohemia.save.v2';
export const LEGACY_SAVE_KEY_V3 = 'chronicles-of-bohemia.save.v3';
export const FALLBACK_SAVE_KEY = 'chronicles-of-bohemia.save.v4';

const DATABASE_NAME = 'chronicles-of-bohemia';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saves';
const PRIMARY_SAVE_ID = 'primary';
const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

interface StoredSaveRecord {
  id: string;
  payload: GameSave;
}

interface UnknownSaveRecord {
  version?: unknown;
  player?: unknown;
  quest?: unknown;
  world?: unknown;
  economy?: unknown;
  reputation?: unknown;
  savedAt?: unknown;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isPlayerState = (value: unknown): value is PlayerSaveState => {
  if (!value || typeof value !== 'object') return false;
  const player = value as Partial<PlayerSaveState>;
  return (
    isFiniteNumber(player.x) &&
    isFiniteNumber(player.y) &&
    isFiniteNumber(player.health) &&
    isFiniteNumber(player.stamina)
  );
};

const isQuestState = (value: unknown): value is QuestState => {
  if (!value || typeof value !== 'object') return false;
  const quest = value as Partial<QuestState>;
  return (
    quest.id === 'first-steel' &&
    (quest.step === 'meet-smith' || quest.step === 'defeat-bandit' || quest.step === 'complete') &&
    typeof quest.banditDefeated === 'boolean'
  );
};

const isWorldState = (value: unknown): value is WorldSaveState => {
  if (!value || typeof value !== 'object') return false;
  return isFiniteNumber((value as Partial<WorldSaveState>).dayClock);
};

const isItemId = (value: unknown): value is ItemId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ITEM_DEFINITIONS, value);

const isStackArray = (value: unknown, enforcePlayerStackLimit: boolean): value is InventoryStack[] => {
  if (!Array.isArray(value)) return false;
  const seen = new Set<ItemId>();

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return false;
    const stack = candidate as Partial<InventoryStack>;
    const itemId = stack.itemId;
    const quantity = stack.quantity;

    if (!isItemId(itemId) || !isPositiveInteger(quantity)) return false;
    if (seen.has(itemId)) return false;
    if (enforcePlayerStackLimit && quantity > ITEM_DEFINITIONS[itemId].maxStack) return false;
    seen.add(itemId);
  }
  return true;
};

const isEquipmentState = (value: unknown): value is EquipmentState => {
  if (!value || typeof value !== 'object') return false;
  const equipment = value as Partial<EquipmentState>;

  return EQUIPMENT_SLOTS.every((slot) => {
    const itemId = equipment[slot];
    if (itemId === null) return true;
    return isItemId(itemId) && ITEM_DEFINITIONS[itemId].equipmentSlot === slot;
  });
};

const isInventoryState = (value: unknown): value is InventoryState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<InventoryState>;
  const groschen = candidate.groschen;
  const maxWeight = candidate.maxWeight;
  const items = candidate.items;
  const equipment = candidate.equipment;

  if (
    !isNonNegativeNumber(groschen) ||
    !isFiniteNumber(maxWeight) ||
    maxWeight <= 0 ||
    !isStackArray(items, true) ||
    !isEquipmentState(equipment)
  ) {
    return false;
  }

  return EQUIPMENT_SLOTS.every((slot) => {
    const itemId = equipment[slot];
    return itemId === null || getItemQuantity(items, itemId) > 0;
  });
};

const isMerchantState = (value: unknown): value is MerchantState => {
  if (!value || typeof value !== 'object') return false;
  const merchant = value as Partial<MerchantState>;
  const groschen = merchant.groschen;
  const stock = merchant.stock;

  return (
    merchant.id === 'trader-katerina' &&
    isNonNegativeNumber(groschen) &&
    isStackArray(stock, false)
  );
};

const isEconomyState = (value: unknown): value is EconomyState => {
  if (!value || typeof value !== 'object') return false;
  const economy = value as Partial<EconomyState>;
  return isInventoryState(economy.inventory) && isMerchantState(economy.merchant);
};

const isReputationValue = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_REPUTATION &&
  value <= MAX_REPUTATION;

const isReputationState = (value: unknown): value is ReputationState => {
  if (!value || typeof value !== 'object') return false;
  const reputation = value as Partial<ReputationState>;
  return (
    isReputationValue(reputation.peasants) &&
    isReputationValue(reputation.townsfolk) &&
    isReputationValue(reputation.nobility)
  );
};

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const buildMigratedSave = (
  candidate: UnknownSaveRecord,
  world: WorldSaveState,
  economy: EconomyState,
  reputation: ReputationState
): GameSave => ({
  version: 4,
  player: candidate.player as PlayerSaveState,
  quest: candidate.quest as QuestState,
  world,
  economy,
  reputation,
  savedAt: candidate.savedAt as string
});

export const migrateGameSave = (value: unknown): GameSave | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as UnknownSaveRecord;

  if (
    candidate.version === 4 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isWorldState(candidate.world) &&
    isEconomyState(candidate.economy) &&
    isReputationState(candidate.reputation) &&
    isTimestamp(candidate.savedAt)
  ) {
    return buildMigratedSave(
      candidate,
      candidate.world,
      candidate.economy,
      candidate.reputation
    );
  }

  if (
    candidate.version === 3 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isWorldState(candidate.world) &&
    isEconomyState(candidate.economy) &&
    isTimestamp(candidate.savedAt)
  ) {
    return buildMigratedSave(
      candidate,
      candidate.world,
      candidate.economy,
      createInitialReputationState()
    );
  }

  if (
    candidate.version === 2 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isWorldState(candidate.world) &&
    isTimestamp(candidate.savedAt)
  ) {
    return buildMigratedSave(
      candidate,
      candidate.world,
      createInitialEconomyState(),
      createInitialReputationState()
    );
  }

  if (
    candidate.version === 1 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isTimestamp(candidate.savedAt)
  ) {
    return buildMigratedSave(
      candidate,
      { dayClock: 0 },
      createInitialEconomyState(),
      createInitialReputationState()
    );
  }

  return null;
};

const parseFallback = (storage: StorageLike, key: string): GameSave | null => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return migrateGameSave(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeFallback = (storage: StorageLike, save: GameSave): boolean => {
  try {
    storage.setItem(FALLBACK_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
};

export class IndexedDbSaveStore implements AsyncSaveStore {
  private databasePromise?: Promise<IDBDatabase>;

  constructor(private readonly factory: IDBFactory) {}

  async get(): Promise<unknown | null> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE_NAME, 'readonly');
      const request = transaction.objectStore(OBJECT_STORE_NAME).get(PRIMARY_SAVE_ID);
      request.onsuccess = () => {
        const record = request.result as StoredSaveRecord | undefined;
        resolve(record?.payload ?? null);
      };
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
    });
  }

  async set(value: GameSave): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE_NAME, 'readwrite');
      transaction.objectStore(OBJECT_STORE_NAME).put({ id: PRIMARY_SAVE_ID, payload: value });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
    });
  }

  async delete(): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE_NAME, 'readwrite');
      transaction.objectStore(OBJECT_STORE_NAME).delete(PRIMARY_SAVE_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB delete aborted.'));
    });
  }

  private open(): Promise<IDBDatabase> {
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
      request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked.'));
    });
    return this.databasePromise;
  }
}

export class SaveSystem {
  private primaryAvailable = true;

  constructor(private readonly options: SaveSystemOptions) {}

  static forBrowser(indexedDB: IDBFactory | undefined, fallback: StorageLike): SaveSystem {
    const primary: AsyncSaveStore = indexedDB
      ? new IndexedDbSaveStore(indexedDB)
      : {
          get: async () => {
            throw new Error('IndexedDB is unavailable.');
          },
          set: async () => {
            throw new Error('IndexedDB is unavailable.');
          },
          delete: async () => {
            throw new Error('IndexedDB is unavailable.');
          }
        };
    return new SaveSystem({ primary, fallback });
  }

  async save(data: GameSaveInput): Promise<GameSave> {
    const payload: GameSave = {
      version: CURRENT_SAVE_VERSION,
      player: data.player,
      quest: data.quest,
      world: data.world,
      economy: data.economy ?? getEconomyState(),
      reputation: data.reputation ?? getReputationState(),
      savedAt: (this.options.now ?? (() => new Date()))().toISOString()
    };

    if (await this.tryPrimarySet(payload)) {
      this.cleanupFallbackKeys();
      return payload;
    }

    if (!writeFallback(this.options.fallback, payload)) {
      throw new Error('Save could not be written to IndexedDB or fallback storage.');
    }
    this.removeLegacyKeys();
    return payload;
  }

  async load(): Promise<GameSave | null> {
    const primary = await this.tryPrimaryGet();
    if (primary) {
      const migrated = migrateGameSave(primary);
      if (migrated) {
        if ((primary as UnknownSaveRecord).version !== CURRENT_SAVE_VERSION) {
          await this.tryPrimarySet(migrated);
        }
        this.restoreRuntimeStores(migrated);
        return migrated;
      }
    }

    const fallbackKeys = [
      FALLBACK_SAVE_KEY,
      LEGACY_SAVE_KEY_V3,
      LEGACY_SAVE_KEY_V2,
      LEGACY_SAVE_KEY
    ] as const;

    for (const key of fallbackKeys) {
      const fallback = parseFallback(this.options.fallback, key);
      if (!fallback) continue;

      if (await this.tryPrimarySet(fallback)) {
        this.cleanupFallbackKeys();
      } else if (key !== FALLBACK_SAVE_KEY && writeFallback(this.options.fallback, fallback)) {
        this.removeLegacyKeys();
      }
      this.restoreRuntimeStores(fallback);
      return fallback;
    }

    return null;
  }

  async hasSave(): Promise<boolean> {
    return (await this.load()) !== null;
  }

  async clear(): Promise<void> {
    if (this.primaryAvailable) {
      try {
        await this.options.primary.delete();
      } catch {
        this.primaryAvailable = false;
      }
    }
    this.cleanupFallbackKeys();
    resetEconomyState();
    resetReputationState();
  }

  private restoreRuntimeStores(save: GameSave): void {
    setEconomyState(save.economy);
    setReputationState(save.reputation);
  }

  private async tryPrimaryGet(): Promise<unknown | null> {
    if (!this.primaryAvailable) return null;
    try {
      return await this.options.primary.get();
    } catch {
      this.primaryAvailable = false;
      return null;
    }
  }

  private async tryPrimarySet(save: GameSave): Promise<boolean> {
    if (!this.primaryAvailable) return false;
    try {
      await this.options.primary.set(save);
      return true;
    } catch {
      this.primaryAvailable = false;
      return false;
    }
  }

  private cleanupFallbackKeys(): void {
    this.safeRemove(FALLBACK_SAVE_KEY);
    this.removeLegacyKeys();
  }

  private removeLegacyKeys(): void {
    this.safeRemove(LEGACY_SAVE_KEY_V3);
    this.safeRemove(LEGACY_SAVE_KEY_V2);
    this.safeRemove(LEGACY_SAVE_KEY);
  }

  private safeRemove(key: string): void {
    try {
      this.options.fallback.removeItem(key);
    } catch {
      // A failed cleanup must not invalidate a successfully stored save.
    }
  }
}
