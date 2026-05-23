/**
 * Wallet interaction model:
 * - Commerce canvas remains mounted; scrim dims, never unmounts catalog memory.
 * - QR + NFC live in elevated slots with z-index `transactional`.
 * - Quick transfers stay one gesture from any product-context panel.
 */
export const walletInteractionArchitecture = {
  layers: ["commerce", "contextPanel", "walletOverlay", "systemToast"] as const,
  gestures: ["pullDownWallet", "edgeSwipeTransfer", "longPressNfcArm"] as const,
} as const;
