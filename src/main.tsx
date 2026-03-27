import { createRoot } from "react-dom/client";
import "./index.css";
import { ensureBrowserStorage, removeStorage } from "./lib/browserStorage";

ensureBrowserStorage("localStorage");
ensureBrowserStorage("sessionStorage");

const bootWindow = window as Window & { __AIQTP_APP_BOOTED__?: boolean };
bootWindow.__AIQTP_APP_BOOTED__ = false;

try {
  removeStorage("sessionStorage", "aiqtp-boot-recovery-v1");
} catch {
  // Ignore restricted-storage environments.
}

void Promise.all([import("./App.tsx"), import("./components/ErrorBoundary")])
  .then(([{ default: App }, { default: ErrorBoundary }]) => {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );

    bootWindow.__AIQTP_APP_BOOTED__ = true;
  })
  .catch((error) => {
    console.error("[Boot] Failed to initialize app:", error);
  });
