import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileCommerceErrorBoundary } from "commerce-humanized-errors";

import { TerrainMobileShell } from "./TerrainMobileShell";
import "commerce-terrain-profile-runtime/terrain-profile.css";
import "commerce-notifications/styles.css";
import "commercial-activity-feed/styles.css";
import "commerce-offline-foundation/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";
import "commerce-humanized-errors/styles.css";
import "@venext/mobile-detaillant/styles/detaillant-global.css";
import "@venext/mobile-grossiste-b/styles/grossiste-b-global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileCommerceErrorBoundary locale="fr-CI" onBack={() => window.history.back()}>
      <TerrainMobileShell />
    </MobileCommerceErrorBoundary>
  </StrictMode>,
);
