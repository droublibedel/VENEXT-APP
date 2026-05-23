"use client";

import type { ReactNode } from "react";

import { VenextAuthProvider, VenextWalletSecurityProvider } from "venext-auth-foundation";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";

export function ProducerAuthProvider({ children }: { children: ReactNode }) {
  const { flags, hydrated } = useIndustrialFeatureFlags();

  if (!hydrated || flags.venext_auth_foundation_enabled === false) {
    return <>{children}</>;
  }

  const walletFlags = {
    venext_auth_foundation_enabled: flags.venext_auth_foundation_enabled,
    terrain_unlimited_session_enabled: flags.terrain_unlimited_session_enabled,
    wallet_adaptive_security_enabled: flags.wallet_adaptive_security_enabled,
    wallet_bceao_kyc_enabled: flags.wallet_bceao_kyc_enabled,
    wallet_biometric_unlock_enabled: flags.wallet_biometric_unlock_enabled,
    wallet_instant_background_lock_enabled: flags.wallet_instant_background_lock_enabled,
    wallet_ultra_short_timeout_enabled: flags.wallet_ultra_short_timeout_enabled,
  };

  return (
    <VenextAuthProvider
      actorRole="PRODUCER"
      flags={{
        ...walletFlags,
        venext_session_restore_enabled: flags.venext_session_restore_enabled,
        venext_profile_foundation_enabled: flags.venext_profile_foundation_enabled,
        professional_commercial_network_enabled: flags.professional_commercial_network_enabled,
        relational_catalog_enabled: flags.relational_catalog_enabled,
        commercial_delivery_flow_enabled: flags.commercial_delivery_flow_enabled,
        commercial_settlement_flow_enabled: flags.commercial_settlement_flow_enabled,
      }}
    >
      <VenextWalletSecurityProvider actorRole="PRODUCER" balanceFcfa={0} flags={walletFlags}>
        {children}
      </VenextWalletSecurityProvider>
    </VenextAuthProvider>
  );
}
