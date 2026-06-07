export type WalletMeResponse = {
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

export type WalletKycSubmitBody = {
  organizationId: string;
  civilFullName: string;
  birthDate: string;
  documentType: "CNI" | "PASSEPORT" | "PERMIS" | "CARTE_SEJOUR";
  documentFileName?: string;
  documentMimeType?: string;
  documentBase64?: string;
};

export const WALLET_PLATFORM_FEATURE_KEYS = [
  "wallet_enabled",
  "wallet_kyc_enabled",
  "wallet_biometric_enabled",
  "wallet_auto_lock_enabled",
  "wallet_provider_gateway_enabled",
] as const;
