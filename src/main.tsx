import { createRoot } from "react-dom/client";
import "./index.css";
import { ensureBrowserStorage, removeStorage, sanitizeSupabaseAuthStorage } from "./lib/browserStorage";
import { initSentry } from "./lib/sentry";
initSentry();

ensureBrowserStorage("localStorage");
ensureBrowserStorage("sessionStorage");

const bootWindow = window as Window & {
  __AIQTP_APP_BOOTED__?: boolean;
  __AIQTP_BOOTSTRAP_STARTED__?: boolean;
};
bootWindow.__AIQTP_BOOTSTRAP_STARTED__ = true;
bootWindow.__AIQTP_APP_BOOTED__ = false;

try {
  removeStorage("sessionStorage", "aiqtp-boot-recovery-v1");
  sanitizeSupabaseAuthStorage();
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

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:hsl(222.2 84% 4.9%);color:hsl(210 40% 98%);padding:24px;">
          <div style="max-width:420px;text-align:center;">
            <h1 style="font-size:1.5rem;font-weight:700;margin:0 0 12px;">App failed to start</h1>
            <p style="margin:0 0 20px;color:hsl(215 20.2% 65.1%);line-height:1.5;">The app hit a startup error. Reload once to try again.</p>
            <button id="aiqtp-boot-reload" style="border:none;border-radius:0.75rem;padding:0.875rem 1.25rem;background:hsl(217.2 91.2% 59.8%);color:hsl(210 40% 98%);font-weight:600;cursor:pointer;">
              Reload app
            </button>
          </div>
        </div>
      `;

      rootElement.querySelector<HTMLButtonElement>("#aiqtp-boot-reload")?.addEventListener("click", () => {
        window.location.reload();
      });
    }

    bootWindow.__AIQTP_APP_BOOTED__ = true;
  });
