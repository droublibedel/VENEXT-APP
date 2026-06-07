import { memo, useEffect } from "react";

import { DetaillantAppShell } from "@venext/mobile-detaillant/app-shell/DetaillantAppShell";
import { DetaillantAuthProvider } from "@venext/mobile-detaillant/auth/DetaillantAuthProvider";
import { DetaillantVenextLocale } from "@venext/mobile-detaillant/i18n/DetaillantVenextLocale";

import { mirrorGrossisteOnboardingForDetaillant } from "./terrain-onboarding-mirror.js";

export const DetaillantProfileHost = memo(function DetaillantProfileHost() {
  useEffect(() => {
    mirrorGrossisteOnboardingForDetaillant();
  }, []);

  return (
    <DetaillantVenextLocale>
      <DetaillantAuthProvider>
        <DetaillantAppShell terrainShellHost />
      </DetaillantAuthProvider>
    </DetaillantVenextLocale>
  );
});
