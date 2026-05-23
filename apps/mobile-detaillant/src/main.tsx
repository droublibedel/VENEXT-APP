import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileCommerceErrorBoundary } from "commerce-humanized-errors";

import { DetaillantAppShell } from "./app-shell/DetaillantAppShell";
import { DetaillantAuthProvider } from "./auth/DetaillantAuthProvider";
import { DetaillantVenextLocale } from "./i18n/DetaillantVenextLocale";
import "./styles/detaillant-global.css";
import "commerce-notifications/styles.css";
import "commercial-activity-feed/styles.css";
import "commerce-offline-foundation/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";
import "commerce-humanized-errors/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DetaillantVenextLocale>
      <MobileCommerceErrorBoundary locale="fr-CI" onBack={() => window.history.back()}>
        <DetaillantAuthProvider>
          <DetaillantAppShell />
        </DetaillantAuthProvider>
      </MobileCommerceErrorBoundary>
    </DetaillantVenextLocale>
  </StrictMode>,
);
