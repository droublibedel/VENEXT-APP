import { ECONOMIC_MEMORY_DEMO_ORGANIZATION_ID } from "./constants";

export type EconomicMemoryOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveEconomicMemoryOrganizationId(): EconomicMemoryOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONOMIC_MEMORY_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: ECONOMIC_MEMORY_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
