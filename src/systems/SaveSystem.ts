import type { QuestState } from './QuestSystem';

export interface PlayerSaveState {
  x: number;
  y: number;
  health: number;
  stamina: number;
}

export interface WorldSaveState {
  dayClock: number;
}

interface GameSaveV1 {
  version: 1;
  player: PlayerSaveState;
  quest: QuestState;
  savedAt: string;
}

export interface GameSave {
  version: 2;
  player: PlayerSaveState;
  quest: QuestState;
  world: WorldSaveState;
  savedAt: string;
}

export type GameSaveInput = Omit<GameSave, 'version' | 'savedAt'>;

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

export const CURRENT_SAVE_VERSION = 2;
export const LEGACY_SAVE_KEY = 'chronicles-of-bohemia.save.v1';
export const FALLBACK_SAVE_KEY = 'chronicles-of-bohemia.save.v2';

const DATABASE_NAME = 'chronicles-of-bohemia';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saves';
const PRIMARY_SAVE_ID = 'primary';

interface StoredSaveRecord {
  id: string;
  payload: GameSave;
}

interface UnknownSaveRecord {
  version?: unknown;
  player?: unknown;
  quest?: unknown;
  world?: unknown;
  savedAt?: unknown;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

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

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

export const migrateGameSave = (value: unknown): GameSave | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as UnknownSaveRecord;

  if (
    candidate.version === 2 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isWorldState(candidate.world) &&
    isTimestamp(candidate.savedAt)
  ) {
    return {
      version: 2,
      player: candidate.player,
      quest: candidate.quest,
      world: candidate.world,
      savedAt: candidate.savedAt
    };
  }

  if (
    candidate.version === 1 &&
    isPlayerState(candidate.player) &&
    isQuestState(candidate.quest) &&
    isTimestamp(candidate.savedAt)
  ) {
    return {
      version: 2,
      player: candidate.player,
      quest: candidate.quest,
      world: { dayClock: 0 },
      savedAt: candidate.savedAt
    };
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
      ...data,
      savedAt: (this.options.now ?? (() => new Date()))().toISOString()
    };

    if (await this.tryPrimarySet(payload)) {
      this.safeRemove(FALLBACK_SAVE_KEY);
      this.safeRemove(LEGACY_SAVE_KEY);
      return payload;
    }

    if (!writeFallback(this.options.fallback, payload)) {
      throw new Error('Save could not be written to IndexedDB or fallback storage.');
    }
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
        return migrated;
      }
    }

    const fallbackCurrent = parseFallback(this.options.fallback, FALLBACK_SAVE_KEY);
    if (fallbackCurrent) {
      if (await this.tryPrimarySet(fallbackCurrent)) this.safeRemove(FALLBACK_SAVE_KEY);
      return fallbackCurrent;
    }

    const legacy = parseFallback(this.options.fallback, LEGACY_SAVE_KEY);
    if (!legacy) return null;

    if (await this.tryPrimarySet(legacy)) {
      this.safeRemove(LEGACY_SAVE_KEY);
    } else if (writeFallback(this.options.fallback, legacy)) {
      this.safeRemove(LEGACY_SAVE_KEY);
    }
    return legacy;
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
    this.safeRemove(FALLBACK_SAVE_KEY);
    this.safeRemove(LEGACY_SAVE_KEY);
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

  private safeRemove(key: string): void {
    try {
      this.options.fallback.removeItem(key);
    } catch {
      // A failed cleanup must not invalidate a successfully stored save.
    }
  }
}
