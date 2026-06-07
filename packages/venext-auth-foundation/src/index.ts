export type {
  VenextActorRole,
  VenextAuthMode,
  VenextActorProfileKind,
  TerrainActorProfile,
  FormalActorProfile,
  VenextActorProfile,
  VenextAuthSession,
  VenextAuthPreferences,
  VenextAuthFlags,
  VenextAuthState,
  VenextPermissionKey,
  VenextGuardResult,
  VenextLocaleTag,
} from "./venext-auth.types";

export {
  VENEXT_SESSION_STORAGE_KEY,
  VENEXT_PROFILE_STORAGE_KEY,
  VENEXT_LOCALE_STORAGE_KEY,
  VENEXT_PREFERENCES_STORAGE_KEY,
  MOCK_TERRAIN_OTP,
  SESSION_TTL_MS,
} from "./venext-auth.types";

export {
  isTerrainActor,
  isFormalActor,
  toGovernanceActorSlug,
  assertActorMatch,
  defaultWorkspaceForActor,
} from "./venext-auth-actor";

export {
  createEmptyTerrainProfile,
  createEmptyFormalProfile,
  isTerrainProfileComplete,
  isFormalProfileComplete,
  normalizeTerrainProfile,
  normalizeFormalProfile,
  profileDisplayLabel,
} from "./venext-auth-profile";

export {
  createSessionId,
  createAuthSession,
  touchSession,
  refreshSessionLocally,
  isActiveSession,
} from "./venext-auth-session";

export { isAuthFoundationEnabled } from "./venext-auth-permissions";

export {
  readPersistedSession,
  writePersistedSession,
  readPersistedProfile,
  writePersistedProfile,
  readPersistedLocale,
  writePersistedLocale,
  clearAllAuthPersistence,
} from "./venext-auth-storage";

export {
  loadPersistedAuthBundle,
  persistAuthBundle,
  persistOnboardingComplete,
  persistLastCommercialContext,
  persistLastWorkspace,
} from "./venext-auth-persistence";

export {
  resolveCommercePermissions,
  hasPermission,
  visiblePermissions,
  permissionLabel,
} from "./venext-auth-permissions";

export {
  requireAuthenticatedActor,
  requireFormalActor,
  requireTerrainActor,
  requireRelationshipPermission,
  guardUxMessage,
} from "./venext-auth-guards";

export {
  maskPhoneNumber,
  isSessionExpired,
  validateSessionActor,
  validateProfileCoherence,
  validateLocaleCoherence,
  validateFlagsCoherence,
  sanitizeAuthErrorMessage,
} from "./venext-auth-security.guard";

export {
  restoreLastWorkspace,
  restoreLastCommercialContext,
  redirectAuthenticatedActor,
  clearCommercialSession,
  rememberNavigationSnapshot,
} from "./venext-auth-navigation";

export { detectDeviceFingerprint } from "./venext-auth-device";

export {
  validateTerrainPhone,
  validateTerrainOtp,
  validateFormalIdentifier,
  validateFormalPassword,
  createInitialAuthState,
  completeTerrainAuth,
  completeFormalAuth,
  logoutAuthState,
  refreshAuthState,
} from "./venext-auth.viewmodel";

export {
  VenextAuthProvider,
  useVenextAuth,
  useVenextAuthOptional,
  emptyProfileForRole,
  isProfileCompleteForRole,
} from "./venext-auth-context";

export type {
  WalletSecurityMode,
  WalletSecurityPersistenceMode,
  WalletSecurityModel,
  WalletIdentityDocument,
  WalletIdentityDocumentType,
  WalletKycIntent,
  WalletSecurityPin,
  WalletActivationStep,
  WalletSecurityState,
  WalletSecurityFlags,
  WalletSecurityContextInput,
  WalletSecurityModeResolution,
} from "./venext-wallet-security.types";

export type { WalletReentryMethod } from "./venext-wallet-security.types";

export {
  BCEAO_SECURED_BALANCE_THRESHOLD_FCFA,
  SECURED_WALLET_IDLE_TIMEOUT_MS,
  SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
  VENEXT_WALLET_SECURITY_STORAGE_KEY,
} from "./venext-wallet-security.types";

export {
  resolveWalletSecurityMode,
  shouldLatchSecuredMode,
  isWalletAdaptiveSecurityEnabled,
  walletActivationDoesNotTriggerSecuredMode,
  resolveTerrainSecuredIdleTimeoutMs,
} from "./venext-wallet-security-mode";

export {
  resolveSecurityModelForActor,
  isTerrainSecurityModel,
  isFormalSecurityModel,
  formalSessionRequiresStrongPassword,
} from "./venext-wallet-security-models";

export {
  validateWalletSecurityPin,
  normalizeWalletSecurityPin,
  pinUxMessage,
  verifyWalletPin,
} from "./venext-wallet-security-pin";

export {
  requiresBceaoKyc,
  validateWalletIdentityDocument,
  kycBlocksCommerceOnboarding,
  nextWalletActivationStep,
} from "./venext-wallet-security-kyc";

export {
  canUseBiometricUnlock,
  enableBiometricUnlock,
  detectBiometricCapability,
} from "./venext-wallet-security-biometric";

export {
  readWalletSecurityState,
  updateWalletSecurityState,
  setWalletSecurityPersistenceMode,
  clearWalletSecurityPersistence,
  defaultWalletSecurityState,
} from "./venext-wallet-security-persistence";

export {
  isSecuredSessionTimedOut,
  secureWalletSession,
  lockWalletSession,
  lockSecuredWalletSessionImmediately,
  restoreSecuredWalletSession,
  configureWalletPin,
  completeWalletActivation,
  touchSecuredWalletActivity,
  securedSessionUxMessage,
} from "./venext-wallet-security-session";

export { resolveWalletReentryMethod } from "./venext-wallet-security-reentry";

export {
  sanitizeWalletSecurityUxText,
  walletSecuredSessionTitle,
  walletSecuredConfirmAccessLabel,
  walletSecuredPinPrompt,
  WALLET_SECURED_UX_LABELS,
} from "./venext-wallet-security-ux";

export { useSecuredWalletTerrainLifecycle } from "./useSecuredWalletTerrainLifecycle";
export { UserActivityTrackerRuntime } from "./user-activity-tracker-runtime";
export type { UserActivityTrackerOptions } from "./user-activity-tracker-runtime";
export { fetchWalletMe, postWalletInactivityLock, postWalletSecurityTouch } from "./wallet-platform-api";
export type { VenextWalletMeDto } from "./wallet-platform-api";
export { useWalletPlatformSync } from "./useWalletPlatformSync";

export {
  isTerrainUnlimitedSession,
  isAuthSessionExpiredForContext,
  parseWalletBalanceFcfa,
} from "./venext-wallet-adaptive-session";

export {
  VenextWalletSecurityProvider,
  useVenextWalletSecurity,
  useVenextWalletSecurityOptional,
} from "./venext-wallet-security-context";

export { WalletBceaoActivationFlow } from "./WalletBceaoActivationFlow";
export { WalletSecuredLockGate } from "./WalletSecuredLockGate";
export { WalletAdaptiveSecurityShell } from "./WalletAdaptiveSecurityShell";
export type { WalletBceaoActivationFlowProps } from "./WalletBceaoActivationFlow";
export type { WalletAdaptiveSecurityShellProps } from "./WalletAdaptiveSecurityShell";

export {
  syncWalletBalanceFcfa,
  readSyncedWalletBalanceFcfa,
  subscribeWalletBalanceSync,
  VENEXT_WALLET_BALANCE_STORAGE_KEY,
  VENEXT_WALLET_BALANCE_SYNC_EVENT,
} from "./venext-wallet-balance-sync";

export { useWalletBalanceSync } from "./useWalletBalanceSync";

export type { AuthWalletSessionContext } from "./venext-auth.viewmodel";
