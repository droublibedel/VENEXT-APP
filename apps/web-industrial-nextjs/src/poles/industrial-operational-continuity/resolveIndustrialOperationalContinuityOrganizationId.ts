import { INDUSTRIAL_OPERATIONAL_CONTINUITY_DEMO_ORGANIZATION_ID } from "./constants";

export type IndustrialOperationalContinuityOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveIndustrialOperationalContinuityOrganizationId(): IndustrialOperationalContinuityOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_INDUSTRIAL_OPERATIONAL_CONTINUITY_ORGANIZATION_ID?.trim()) ||
    "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: INDUSTRIAL_OPERATIONAL_CONTINUITY_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
