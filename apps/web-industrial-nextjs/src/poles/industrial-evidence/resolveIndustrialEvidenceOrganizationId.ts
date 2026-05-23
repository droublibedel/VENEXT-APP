import { INDUSTRIAL_EVIDENCE_DEMO_ORGANIZATION_ID } from "./constants";

export function resolveIndustrialEvidenceOrganizationId(): { organizationId: string; source: string } {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_INDUSTRIAL_EVIDENCE_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) return { organizationId: fromEnv, source: "env" };
  return { organizationId: INDUSTRIAL_EVIDENCE_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
