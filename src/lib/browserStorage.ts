type StorageKey = "localStorage" | "sessionStorage";

const memoryStorageFallbacks: Partial<Record<StorageKey, Storage>> = {};

const SUPABASE_AUTH_STORAGE_KEY = /^sb-[a-z0-9]+-auth-token$/i;

const installGlobalStorageFallback = (storageKey: StorageKey, storage: Storage) => {
  if (typeof window === "undefined") return;

  const descriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: true,
    get: () => storage,
  };

  for (const target of [window, globalThis] as object[]) {
    try {
      Object.defineProperty(target, storageKey, descriptor);
    } catch {
      // Ignore environments where the storage property is non-configurable.
    }
  }
};

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

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const input = `${normalized}${padding}`;

  if (typeof atob === "function") {
    return atob(input);
  }

  return "";
};

const hasValidJwtSubject = (token: unknown) => {
  if (typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return typeof payload?.sub === "string" && payload.sub.trim().length > 0;
  } catch {
    return false;
  }
};

const getSessionCandidate = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;

  if ("access_token" in value || "refresh_token" in value) {
    return value as Record<string, unknown>;
  }

  if ("currentSession" in value && value.currentSession && typeof value.currentSession === "object") {
    return value.currentSession as Record<string, unknown>;
  }

  if ("session" in value && value.session && typeof value.session === "object") {
    return value.session as Record<string, unknown>;
  }

  return null;
};

const isInvalidSupabaseAuthPayload = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    const session = getSessionCandidate(parsed);
    if (!session) return true;

    if (!hasValidJwtSubject(session.access_token)) return true;

    if (session.user != null) {
      if (typeof session.user !== "object") return true;
      const userId = (session.user as Record<string, unknown>).id;
      if (typeof userId !== "string" || userId.trim().length === 0) return true;
    }

    return false;
  } catch {
    return true;
  }
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
    installGlobalStorageFallback(storageKey, memoryStorage);
    return memoryStorage;
  }
};

export const sanitizeSupabaseAuthStorage = () => {
  for (const storageKey of ["localStorage", "sessionStorage"] as const) {
    const storage = ensureBrowserStorage(storageKey);
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => Boolean(key)
    );

    for (const key of keys) {
      if (!SUPABASE_AUTH_STORAGE_KEY.test(key)) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      if (isInvalidSupabaseAuthPayload(raw)) {
        storage.removeItem(key);
      }
    }
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