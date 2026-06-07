import { useEffect, type ReactNode } from "react";

import {
  VenextAuthProvider,
  VenextWalletSecurityProvider,
  useVenextAuth,
  type WalletSecurityFlags,
} from "venext-auth-foundation";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import {
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
} from "../onboarding/grossiste-b-onboarding.viewmodel";

function GrossisteBLegacySessionSync({ children }: { children: ReactNode }) {
  const { isAuthenticated, establishTerrainSession } = useVenextAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    if (!isGrossisteBOnboardingComplete()) return;
    const legacy = loadGrossisteBOnboardingProfile();
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
  flags: ReturnType<typeof useGrossisteFeatureFlags>["flags"],
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

export function GrossisteBAuthProvider({
  children,
  walletBalanceFcfa = 0,
}: {
  children: ReactNode;
  walletBalanceFcfa?: number;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const walletFlags = buildWalletSecurityFlags(flags);

  if (!hydrated || flags.venext_auth_foundation_enabled === false) {
    return <>{children}</>;
  }

  return (
    <VenextAuthProvider
      actorRole="GROSSISTE_B"
      walletBalanceFcfa={walletBalanceFcfa}
      flags={{
        ...walletFlags,
        venext_session_restore_enabled: flags.venext_session_restore_enabled,
        venext_profile_foundation_enabled: flags.venext_profile_foundation_enabled,
        grossiste_b_commerce_messaging_enabled: flags.grossiste_b_commerce_messaging_enabled,
        relational_catalog_enabled: flags.relational_catalog_enabled,
        commercial_auto_accept_enabled: flags.commercial_auto_accept_enabled,
        commercial_delivery_flow_enabled: flags.commercial_delivery_flow_enabled,
        commercial_settlement_flow_enabled: flags.commercial_settlement_flow_enabled,
        commerce_hybrid_settlement_enabled: flags.commerce_hybrid_settlement_enabled,
        professional_commercial_network_enabled: flags.professional_commercial_network_enabled,
      }}
    >
      <VenextWalletSecurityProvider
        actorRole="GROSSISTE_B"
        balanceFcfa={walletBalanceFcfa}
        flags={walletFlags}
      >
        <GrossisteBLegacySessionSync>{children}</GrossisteBLegacySessionSync>
      </VenextWalletSecurityProvider>
    </VenextAuthProvider>
  );
}
