import type { VenextActorRole, VenextAuthFlags } from "./venext-auth.types";

export const BCEAO_SECURED_BALANCE_THRESHOLD_FCFA = 1000;
/** VENEXT-WALLET-SECURITY-01 — inactivité terrain wallet sécurisé (15 s). */
export const SECURED_WALLET_IDLE_TIMEOUT_MS = 15_000;
/** Producteur / Grossiste A — session professionnelle (inchangé 20.78-A). */
export const SECURED_WALLET_INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
export const VENEXT_WALLET_SECURITY_STORAGE_KEY = "venext_wallet_security_v1";

export type WalletReentryMethod = "BIOMETRIC" | "PIN_ONLY";

export type WalletSecurityMode = "LIGHT_COMMERCE_MODE" | "SECURED_WALLET_MODE";

export type WalletSecurityPersistenceMode = "LIGHT_ONLY" | "SECURED_LATCHED";

export type TerrainSecurityModel = "TERRAIN_SECURITY_MODEL";
export type FormalSecurityModel = "FORMAL_SECURITY_MODEL";
export type WalletSecurityModel = TerrainSecurityModel | FormalSecurityModel;

export type WalletIdentityDocumentType =
  | "CNI"
  | "PASSEPORT"
  | "PERMIS"
  | "CARTE_CONSULAIRE";

export type WalletKycIntent = "receive" | "hold" | "pay";

export type WalletIdentityDocument = {
  firstName: string;
  lastName: string;
  birthDate: string;
  documentType: WalletIdentityDocumentType;
  documentNumber: string;
  photoQuality: "ok" | "blur" | "incomplete" | "missing";
};

export type WalletSecurityPin = string;

export type WalletActivationStep =
  | "activation"
  | "identity"
  | "document"
  | "pin"
  | "biometric"
  | "done";

export type WalletSecurityState = {
  walletActivated: boolean;
  kycCompleted: boolean;
  pinConfigured: boolean;
  pinHash?: string;
  biometricEnabled: boolean;
  persistenceMode: WalletSecurityPersistenceMode;
  locked: boolean;
  lastUnlockedAt: string | null;
  lastActivityAt: string | null;
  activationStep: WalletActivationStep;
};

export type WalletSecurityFlags = VenextAuthFlags & {
  terrain_unlimited_session_enabled?: boolean;
  wallet_adaptive_security_enabled?: boolean;
  wallet_bceao_kyc_enabled?: boolean;
  wallet_biometric_unlock_enabled?: boolean;
  /** Instruction 20.78-B — verrouillage immédiat arrière-plan (terrain sécurisé). */
  wallet_instant_background_lock_enabled?: boolean;
  /** Instruction 20.78-B — timeout inactivité 20 s (terrain sécurisé uniquement). */
  wallet_ultra_short_timeout_enabled?: boolean;
};

export type WalletSecurityContextInput = {
  actorRole: VenextActorRole;
  balanceFcfa: number;
  walletActivated?: boolean;
  flags?: WalletSecurityFlags;
  persistenceMode?: WalletSecurityPersistenceMode;
};

export type WalletSecurityModeResolution = {
  mode: WalletSecurityMode;
  securityModel: WalletSecurityModel;
  unlimitedTerrainSession: boolean;
  requiresKycForMoney: boolean;
  requiresPinUnlock: boolean;
  inactivityTimeoutMs: number | null;
};
