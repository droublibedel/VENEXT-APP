import { useEffect, type ReactNode } from "react";

import {
  VenextAuthProvider,
  VenextWalletSecurityProvider,
  useVenextAuth,
  type WalletSecurityFlags,
} from "venext-auth-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import {
  isDetaillantOnboardingComplete,
  loadDetaillantOnboardingProfile,
} from "../onboarding/detaillant-onboarding.viewmodel";

function DetaillantLegacySessionSync({ children }: { children: ReactNode }) {
  const { isAuthenticated, establishTerrainSession } = useVenextAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    if (!isDetaillantOnboardingComplete()) return;
    const legacy = loadDetaillantOnboardingProfile();
    if (!legacy?.phone || !legacy.displayName) return;
    establishTerrainSession({
      phone: legacy.phone,
      displayName: legacy.displayName,
      activities: legacy.activities ?? [],
      city: legacy.city,
      otpVerified: true,
      organizationId: legacy.organizationId,
    });
  }, [isAuthenticated, establishTerrainSession]);

  return <>{children}</>;
}

function buildWalletSecurityFlags(
  flags: ReturnType<typeof useDetaillantFeatureFlags>["flags"],
): WalletSecurityFlags {
  return {
    venext_auth_foundation_enabled: flags.venext_auth_foundation_enabled,
    terrain_unlimited_session_enabled: flags.terrain_unlimited_session_enabled,
    wallet_adaptive_security_enabled: flags.wallet_adaptive_security_enabled,
    wallet_bceao_kyc_enabled: flags.wallet_bceao_kyc_enabled,
    wallet_biometric_unlock_enabled: flags.wallet_biometric_unlock_enabled,
    wallet_instant_background_lock_enabled: flags.wallet_instant_background_lock_enabled,
    wallet_ultra_short_timeout_enabled: flags.wallet_ultra_short_timeout_enabled,
  };
}

export function DetaillantAuthProvider({
  children,
  walletBalanceFcfa = 0,
}: {
  children: ReactNode;
  walletBalanceFcfa?: number;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const walletFlags = buildWalletSecurityFlags(flags);

  if (!hydrated || flags.venext_auth_foundation_enabled === false) {
    return <>{children}</>;
  }

  return (
    <VenextAuthProvider
      actorRole="DETAILLANT"
      walletBalanceFcfa={walletBalanceFcfa}
      flags={{
        ...walletFlags,
        venext_session_restore_enabled: flags.venext_session_restore_enabled,
        venext_profile_foundation_enabled: flags.venext_profile_foundation_enabled,
        grossiste_b_commerce_messaging_enabled: flags.detaillant_commerce_messaging_enabled,
        relational_catalog_enabled: flags.relational_catalog_enabled,
        commercial_delivery_flow_enabled: flags.commercial_delivery_flow_enabled,
        commercial_settlement_flow_enabled: flags.commercial_settlement_flow_enabled,
      }}
    >
      <VenextWalletSecurityProvider
        actorRole="DETAILLANT"
        balanceFcfa={walletBalanceFcfa}
        flags={walletFlags}
      >
        <DetaillantLegacySessionSync>{children}</DetaillantLegacySessionSync>
      </VenextWalletSecurityProvider>
    </VenextAuthProvider>
  );
}
