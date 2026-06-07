import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileCommerceErrorBoundary } from "commerce-humanized-errors";
import { ProfileRuntimeProvider } from "commerce-terrain-profile-runtime";

import { DetaillantAppShell } from "./app-shell/DetaillantAppShell";
import { DetaillantAuthProvider } from "./auth/DetaillantAuthProvider";
import { DetaillantVenextLocale } from "./i18n/DetaillantVenextLocale";
import "./styles/detaillant-global.css";
import "@venext/mobile-grossiste-b/styles/grossiste-b-global.css";
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
        <ProfileRuntimeProvider>
          <DetaillantAuthProvider>
            <DetaillantAppShell />
          </DetaillantAuthProvider>
        </ProfileRuntimeProvider>
      </MobileCommerceErrorBoundary>
    </DetaillantVenextLocale>
  </StrictMode>,
);
