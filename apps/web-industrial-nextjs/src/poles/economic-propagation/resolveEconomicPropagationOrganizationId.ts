import { ECONOMIC_PROPAGATION_DEMO_ORGANIZATION_ID } from "./constants";

export type EconomicPropagationOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveEconomicPropagationOrganizationId(): EconomicPropagationOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONOMIC_PROPAGATION_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: ECONOMIC_PROPAGATION_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
