import { ECONOMIC_COORDINATION_DEMO_ORGANIZATION_ID } from "./constants";

export type EconomicCoordinationOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveEconomicCoordinationOrganizationId(): EconomicCoordinationOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONOMIC_COORDINATION_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: ECONOMIC_COORDINATION_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
