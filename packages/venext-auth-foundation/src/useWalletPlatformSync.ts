import { useCallback, useEffect, useState } from "react";

import { fetchWalletMe, postWalletSecurityTouch, type VenextWalletMeDto } from "./wallet-platform-api";
import { updateWalletSecurityState } from "./venext-wallet-security-persistence";

export function useWalletPlatformSync(input: {
  organizationId: string | null | undefined;
  deviceId?: string;
  enabled?: boolean;
  liveEnabled?: boolean;
}): {
  me: VenextWalletMeDto | null;
  loading: boolean;
  refresh: () => void;
} {
  const { organizationId, deviceId, enabled = true, liveEnabled = true } = input;
  const [me, setMe] = useState<VenextWalletMeDto | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!enabled || !liveEnabled || !organizationId) return;
    setLoading(true);
    void fetchWalletMe(organizationId, deviceId).then((result) => {
      setLoading(false);
      if (!result.data) return;
      setMe(result.data);
      updateWalletSecurityState({
        walletActivated: result.data.walletActivated,
        kycCompleted: result.data.kycStatus === "ACTIVE",
        locked: result.data.locked,
        biometricEnabled: result.data.biometricEnabled,
        persistenceMode:
          result.data.balanceFcfa >= 1000 && result.data.walletActivated
            ? "SECURED_LATCHED"
            : "LIGHT_ONLY",
      });
    });
  }, [deviceId, enabled, liveEnabled, organizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !liveEnabled || !organizationId) return;
    const id = window.setInterval(() => {
      void postWalletSecurityTouch(organizationId);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, liveEnabled, organizationId]);

  return { me, loading, refresh };
}
