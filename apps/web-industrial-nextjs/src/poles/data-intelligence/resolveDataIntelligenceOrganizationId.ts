import { DATA_INTELLIGENCE_DEMO_ORGANIZATION_ID } from "./constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DataIntelligenceOrgResolution = {
  organizationId: string;
  usedDemoFallback: boolean;
  /** Short UI label describing org source. */
  sourceLabel: string;
};

/**
 * Instruction 17A — prefer explicit acting org from env; never silently pretend a demo UUID is production data.
 */
export function resolveDataIntelligenceOrganizationId(): DataIntelligenceOrgResolution {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VENEXT_ACTING_ORGANIZATION_ID?.trim()) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DATA_INTELLIGENCE_ORGANIZATION_ID?.trim()) ||
    "";
  if (raw && UUID_RE.test(raw)) {
    return {
      organizationId: raw,
      usedDemoFallback: false,
      sourceLabel: `Acting org ${raw.slice(0, 8)}… (NEXT_PUBLIC_VENEXT_ACTING_ORGANIZATION_ID)`,
    };
  }
  return {
    organizationId: DATA_INTELLIGENCE_DEMO_ORGANIZATION_ID,
    usedDemoFallback: true,
    sourceLabel: "Demo org — set NEXT_PUBLIC_VENEXT_ACTING_ORGANIZATION_ID to bind HTTP + WS to your producer UUID.",
  };
}
