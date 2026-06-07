/** VENEXT-WALLET-SECURITY-01 — wallet connecté au BFF uniquement si flags + org présents. */
export function resolveWalletLiveEnabled(input: {
  walletEnabled?: boolean;
  bffRoutesEnabled?: boolean;
  backendPersistenceEnabled?: boolean;
  organizationId?: string | null;
}): boolean {
  if (input.walletEnabled === false) return false;
  if (!input.organizationId) return false;
  if (input.bffRoutesEnabled === false) return false;
  if (input.backendPersistenceEnabled === false) return false;
  return true;
}
