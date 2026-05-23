export const VENEXT_WALLET_BALANCE_STORAGE_KEY = "venext_wallet_balance_fcfa_v1";
export const VENEXT_WALLET_BALANCE_SYNC_EVENT = "venext-wallet-balance-sync";

export function syncWalletBalanceFcfa(balanceFcfa: number): void {
  const value = String(Math.max(0, Math.floor(balanceFcfa)));
  try {
    localStorage.setItem(VENEXT_WALLET_BALANCE_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(VENEXT_WALLET_BALANCE_SYNC_EVENT, { detail: Number(value) }),
    );
  }
}

export function readSyncedWalletBalanceFcfa(): number {
  try {
    const raw = localStorage.getItem(VENEXT_WALLET_BALANCE_STORAGE_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function subscribeWalletBalanceSync(
  listener: (balanceFcfa: number) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<number>).detail;
    listener(typeof detail === "number" ? detail : readSyncedWalletBalanceFcfa());
  };
  window.addEventListener(VENEXT_WALLET_BALANCE_SYNC_EVENT, handler);
  return () => window.removeEventListener(VENEXT_WALLET_BALANCE_SYNC_EVENT, handler);
}
