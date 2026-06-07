import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileCommerceErrorBoundary } from "commerce-humanized-errors";
import { ProfileRuntimeProvider } from "commerce-terrain-profile-runtime";

import { GrossisteBAppShell } from "./app-shell/GrossisteBAppShell";
import { GrossisteBAuthProvider } from "./auth/GrossisteBAuthProvider";
import { GrossisteVenextLocale } from "./i18n/GrossisteVenextLocale";
import "./styles/grossiste-b-global.css";
import "commerce-notifications/styles.css";
import "commercial-activity-feed/styles.css";
import "commerce-offline-foundation/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";
import "commerce-humanized-errors/styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <GrossisteVenextLocale>
      <MobileCommerceErrorBoundary locale="fr-CI" onBack={() => window.history.back()}>
        <ProfileRuntimeProvider>
          <GrossisteBAuthProvider>
            <GrossisteBAppShell />
          </GrossisteBAuthProvider>
        </ProfileRuntimeProvider>
      </MobileCommerceErrorBoundary>
    </GrossisteVenextLocale>
  </StrictMode>,
);
