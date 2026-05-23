import type { BackofficeFeatureFlagState } from "../types/platform.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";

export const BACKOFFICE_FLAG_KEYS = [
  "backoffice_auth_enabled",
  "backoffice_error_observability_enabled",
  "backoffice_journey_monitoring_enabled",
  "backoffice_support_desk_enabled",
  "backoffice_platform_health_enabled",
  "backoffice_product_quality_enabled",
  "backoffice_live_persistence_enabled",
  "backoffice_live_governance_enabled",
  "backoffice_operational_health_enabled",
] as const;

export type BackofficeFlagKey = (typeof BACKOFFICE_FLAG_KEYS)[number];

const DEFAULT_FLAGS: BackofficeFeatureFlagState[] = [
  {
    key: "backoffice_auth_enabled",
    enabled: true,
    environment: "development",
    description: "Connexion back-office email + OTP",
  },
  {
    key: "backoffice_error_observability_enabled",
    enabled: true,
    environment: "development",
    description: "Observabilité erreurs utilisateur",
  },
  {
    key: "backoffice_journey_monitoring_enabled",
    enabled: true,
    environment: "development",
    description: "Monitoring parcours A→B",
  },
  {
    key: "backoffice_support_desk_enabled",
    enabled: true,
    environment: "development",
    description: "Bureau assistance interne",
  },
  {
    key: "backoffice_platform_health_enabled",
    enabled: true,
    environment: "development",
    description: "Santé plateforme",
  },
  {
    key: "backoffice_product_quality_enabled",
    enabled: true,
    environment: "development",
    description: "Centre qualité produit",
  },
  {
    key: "backoffice_live_persistence_enabled",
    enabled: true,
    environment: "development",
    description: "Persistance Prisma réelle back-office",
  },
  {
    key: "backoffice_live_governance_enabled",
    enabled: true,
    environment: "development",
    description: "Synchronisation live gouvernance grands comptes",
  },
  {
    key: "backoffice_operational_health_enabled",
    enabled: true,
    environment: "development",
    description: "Health checks opérationnels réels",
  },
];

export function seedBackofficeFeatureFlags(env: "development" | "production" = "development"): void {
  const store = getBackofficeStore();
  if (store.flags.length > 0) return;
  const prod = env === "production";
  store.flags = DEFAULT_FLAGS.map((f) => ({
    ...f,
    environment: env,
    enabled: prod ? false : true,
  }));
}

export function isBackofficeFlagEnabled(key: string, env: "development" | "production" = "development"): boolean {
  seedBackofficeFeatureFlags(env);
  const row = getBackofficeStore().flags.find((f) => f.key === key);
  if (!row) return false;
  return row.enabled;
}

export async function patchBackofficeFlag(
  key: string,
  enabled: boolean,
  actor: { email: string; id: string },
  note: string,
): Promise<BackofficeFeatureFlagState | undefined> {
  seedBackofficeFeatureFlags();
  const store = getBackofficeStore();
  const idx = store.flags.findIndex((f) => f.key === key);
  if (idx < 0) return undefined;
  if (!note.trim()) {
    throw new Error("note_required");
  }
  const prev = store.flags[idx]!;
  store.flags[idx] = {
    ...prev,
    enabled,
    lastChangedAt: new Date().toISOString(),
    lastChangedBy: actor.email,
    lastNote: note.trim(),
  };
  const { immutableBackofficeAuditTrail } = await import("../audit/immutable-audit-trail.js");
  await immutableBackofficeAuditTrail({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "feature_flag_patch",
    targetType: "feature_flag",
    targetId: key,
    note: note.trim(),
    metadata: { before: prev.enabled, after: enabled },
  });
  return store.flags[idx];
}
