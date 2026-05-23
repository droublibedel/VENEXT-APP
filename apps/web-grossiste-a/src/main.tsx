import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GlobalCommerceErrorBoundary } from "commerce-humanized-errors";

import { GrossisteAAppShell } from "./app-shell/GrossisteAAppShell";
import { GrossisteAAuthProvider } from "./auth/GrossisteAAuthProvider";
import { GrossisteAVenextLocale } from "./i18n/GrossisteAVenextLocale";
import "./styles/grossiste-a-global.css";
import "commerce-notifications/styles.css";
import "commercial-activity-feed/styles.css";
import "commerce-offline-foundation/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";
import "commerce-humanized-errors/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GrossisteAVenextLocale>
      <GlobalCommerceErrorBoundary locale="fr-CI" onBack={() => window.history.back()}>
        <GrossisteAAuthProvider>
          <GrossisteAAppShell />
        </GrossisteAAuthProvider>
      </GlobalCommerceErrorBoundary>
    </GrossisteAVenextLocale>
  </StrictMode>,
);
