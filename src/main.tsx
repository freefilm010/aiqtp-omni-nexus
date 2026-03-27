import { createRoot } from "react-dom/client";
import "./index.css";

type StorageKey = "localStorage" | "sessionStorage";

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

const ensureStorage = (storageKey: StorageKey) => {
  try {
    const storage = window[storageKey];
    const probe = "__aiqtp_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    const memoryStorage = createMemoryStorage();
    Object.defineProperty(window, storageKey, {
      configurable: true,
      value: memoryStorage,
    });
    return memoryStorage;
  }
};

ensureStorage("localStorage");
const sessionStorageSafe = ensureStorage("sessionStorage");

(window as Window & { __AIQTP_APP_BOOTED__?: boolean }).__AIQTP_APP_BOOTED__ = true;

try {
  sessionStorageSafe.removeItem("aiqtp-boot-recovery-v1");
} catch {
  // Ignore restricted-storage environments.
}

Promise.all([import("./App.tsx"), import("./components/ErrorBoundary")]).then(
  ([{ default: App }, { default: ErrorBoundary }]) => {
    createRoot(document.getElementById("root")!).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
);
