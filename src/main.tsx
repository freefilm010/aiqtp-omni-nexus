import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

(window as Window & { __AIQTP_APP_BOOTED__?: boolean }).__AIQTP_APP_BOOTED__ = true;

try {
  sessionStorage.removeItem("aiqtp-boot-recovery-v1");
} catch {
  // Ignore restricted-storage environments.
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
