export type VenextWalletMeDto = {
  organizationId: string;
  walletId: string;
  accountId: string;
  balanceFcfa: number;
  currency: string;
  kycStatus: string;
  walletActivated: boolean;
  locked: boolean;
  biometricEnabled: boolean;
  featureFlags: Record<string, boolean>;
  activeSessions: Array<{
    deviceId: string;
    label: string;
    lastActiveAt: string;
    trusted: boolean;
  }>;
};

export async function fetchWalletMe(
  organizationId: string,
  deviceId?: string,
): Promise<{ data: VenextWalletMeDto | null; error: string | null }> {
  if (!organizationId) return { data: null, error: "missing_org" };
  const qs = new URLSearchParams({ organizationId });
  if (deviceId) qs.set("deviceId", deviceId);
  try {
    const res = await fetch(`/api/wallet/me?${qs}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return { data: null, error: `http_${res.status}` };
    return { data: (await res.json()) as VenextWalletMeDto, error: null };
  } catch {
    return { data: null, error: "network" };
  }
}

export async function postWalletSecurityTouch(organizationId: string): Promise<void> {
  if (!organizationId) return;
  try {
    await fetch("/api/wallet/security/touch", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
  } catch {
    /* best effort */
  }
}

export async function postWalletInactivityLock(organizationId: string): Promise<void> {
  if (!organizationId) return;
  try {
    await fetch("/api/wallet/security/inactivity-lock", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
  } catch {
    /* best effort */
  }
}
