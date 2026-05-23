import { ECONOMIC_SCENARIOS_DEMO_ORGANIZATION_ID } from "./constants";

export type EconomicScenariosOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveEconomicScenariosOrganizationId(): EconomicScenariosOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONOMIC_SCENARIOS_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: ECONOMIC_SCENARIOS_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
