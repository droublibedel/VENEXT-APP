import { memo, useEffect } from "react";

import { GrossisteBAppShell } from "@venext/mobile-grossiste-b/app-shell/GrossisteBAppShell";
import { GrossisteBAuthProvider } from "@venext/mobile-grossiste-b/auth/GrossisteBAuthProvider";
import { GrossisteVenextLocale } from "@venext/mobile-grossiste-b/i18n/GrossisteVenextLocale";

import { mirrorDetaillantOnboardingForGrossiste } from "./terrain-onboarding-mirror.js";

export const GrossisteBProfileHost = memo(function GrossisteBProfileHost() {
  useEffect(() => {
    mirrorDetaillantOnboardingForGrossiste();
  }, []);

  return (
    <GrossisteVenextLocale>
      <GrossisteBAuthProvider>
        <GrossisteBAppShell terrainShellHost />
      </GrossisteBAuthProvider>
    </GrossisteVenextLocale>
  );
});
