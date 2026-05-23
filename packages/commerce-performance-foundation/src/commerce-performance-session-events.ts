export type CommerceSessionCleanupReason =
  | "logout"
  | "user_suspended"
  | "enterprise_suspended"
  | "enterprise_archived"
  | "session_invalidated"
  | "user_replaced"
  | "wallet_secured_lock";

export type CommerceSessionCleanupDetail = {
  organizationId: string;
  reason: CommerceSessionCleanupReason;
};

export const COMMERCE_SESSION_CLEANUP_EVENT = "venext:commerce-session-cleanup";
export const WALLET_SECURED_LOCK_EVENT = "venext:wallet-secured-lock";

export function dispatchCommerceSessionCleanup(detail: CommerceSessionCleanupDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COMMERCE_SESSION_CLEANUP_EVENT, { detail }));
}

export function dispatchWalletSecuredLock(organizationId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(WALLET_SECURED_LOCK_EVENT, {
      detail: { organizationId: organizationId ?? "" },
    }),
  );
}

export function subscribeCommerceSessionCleanup(
  handler: (detail: CommerceSessionCleanupDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (e: Event) => {
    const ce = e as CustomEvent<CommerceSessionCleanupDetail>;
    if (ce.detail?.organizationId) handler(ce.detail);
  };
  window.addEventListener(COMMERCE_SESSION_CLEANUP_EVENT, listener);
  return () => window.removeEventListener(COMMERCE_SESSION_CLEANUP_EVENT, listener);
}

export function subscribeWalletSecuredLock(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = () => handler();
  window.addEventListener(WALLET_SECURED_LOCK_EVENT, listener);
  return () => window.removeEventListener(WALLET_SECURED_LOCK_EVENT, listener);
}
