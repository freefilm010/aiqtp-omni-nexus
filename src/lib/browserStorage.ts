type StorageKey = "localStorage" | "sessionStorage";

const memoryStorageFallbacks: Partial<Record<StorageKey, Storage>> = {};

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
};

export const ensureBrowserStorage = (storageKey: StorageKey): Storage => {
  if (typeof window === "undefined") {
    return createMemoryStorage();
  }

  if (memoryStorageFallbacks[storageKey]) {
    return memoryStorageFallbacks[storageKey]!;
  }

  try {
    const storage = window[storageKey];
    const probe = "__aiqtp_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    const memoryStorage = createMemoryStorage();
    memoryStorageFallbacks[storageKey] = memoryStorage;
    return memoryStorage;
  }
};

export const readStorage = (storageKey: StorageKey, key: string) => {
  return ensureBrowserStorage(storageKey).getItem(key);
};

export const writeStorage = (storageKey: StorageKey, key: string, value: string) => {
  ensureBrowserStorage(storageKey).setItem(key, value);
};

export const removeStorage = (storageKey: StorageKey, key: string) => {
  ensureBrowserStorage(storageKey).removeItem(key);
};

export const readJsonStorage = <T>(storageKey: StorageKey, key: string, fallback: T): T => {
  const raw = readStorage(storageKey, key);
  if (!raw) return fallback;

  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

export const writeJsonStorage = (storageKey: StorageKey, key: string, value: unknown) => {
  writeStorage(storageKey, key, JSON.stringify(value));
};