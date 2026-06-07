export const TERRAIN_PROFILE_IDS = ["grossiste_b", "detaillant"] as const;

export type TerrainProfileId = (typeof TERRAIN_PROFILE_IDS)[number];

export type TerrainProfileApiId = "GROSSISTE_B" | "DETAILLANT";

export type TerrainProfilePermissions = {
  profile: TerrainProfileApiId;
  canAccessCatalog: boolean;
  canAccessOrders: boolean;
  canAccessNetwork: boolean;
  canAccessMessaging: boolean;
  ordersMode: "network_sales_downstream" | "supplier_purchases_upstream";
  featureFlags: Record<string, boolean>;
};

export type TerrainProfileState = {
  userKey: string;
  enabledProfiles: TerrainProfileId[];
  primaryProfile: TerrainProfileId | null;
  currentActiveProfile: TerrainProfileId | null;
  lastActiveProfile?: TerrainProfileId | null;
  profileContextId?: string;
  profileSessionId?: string;
  activatedAt?: string;
  switchedAt?: string;
  lastSyncedAt?: string;
  switchReason?: string;
  source?: string;
  switchCount: number;
  activeProfileVersion?: number;
  deviceId?: string;
  /** true when profile comes from local cache only — replaced when backend responds */
  cachedProfile?: boolean;
  /** switch requested offline, awaiting backend confirmation */
  pendingSwitchProfile?: TerrainProfileId | null;
  permissions?: TerrainProfilePermissions;
};

export type TerrainProfileSwitchResult = {
  previous: TerrainProfileId | null;
  active: TerrainProfileId;
  remountKey: number;
  confirmedByBackend: boolean;
};

export type TerrainProfileBackendIdentity = Partial<TerrainProfileState> & {
  permissions?: TerrainProfilePermissions;
};

export function toApiProfileId(profile: TerrainProfileId): TerrainProfileApiId {
  return profile === "grossiste_b" ? "GROSSISTE_B" : "DETAILLANT";
}

export function fromApiProfileId(value: string): TerrainProfileId | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "GROSSISTE_B" || normalized === "GROSSISTE-B") return "grossiste_b";
  if (normalized === "DETAILLANT") return "detaillant";
  return null;
}

export function profileLabel(profile: TerrainProfileId): string {
  return profile === "grossiste_b" ? "Grossiste" : "Détaillant";
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
