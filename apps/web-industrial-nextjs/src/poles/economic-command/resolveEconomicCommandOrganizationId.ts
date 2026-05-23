import { ECONOMIC_COMMAND_DEMO_ORGANIZATION_ID } from "./constants";

export type EconomicCommandOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveEconomicCommandOrganizationId(): EconomicCommandOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONOMIC_COMMAND_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: ECONOMIC_COMMAND_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
