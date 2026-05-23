export type VenextActorSurface =
  | "producteur"
  | "grossiste_a"
  | "grossiste_b"
  | "detaillant";

export type VenextV1Flags = Record<string, boolean | undefined>;

export type VenextReadinessCheck = {
  id: string;
  ok: boolean;
  message: string;
  severity: "critical" | "warning" | "info";
};

export type VenextProductionReadiness = {
  ready: boolean;
  score: number;
  checks: VenextReadinessCheck[];
  philosophyOk: boolean;
  mobileOk: boolean;
  webOk: boolean;
  backendOk: boolean;
  v1Frozen: true;
};

export type FeatureFlagAuditResult = {
  ok: boolean;
  issues: { group: string; message: string; keys?: string[] }[];
  unusedWarnings: string[];
  missingProduction: string[];
};
