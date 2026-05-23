import { BadRequestException } from "@nestjs/common";

import type { ShockSeverity } from "@venext/shared-contracts";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

export const SUPPORTED_SIMULATION_TRIGGERS = new Set([
  "shipment_delayed",
  "liquidity_collapse",
  "territory_overheating",
  "network_saturation",
  "payment_instability",
  "distribution_fragility",
]);

const SEVERITY_VALUES = new Set<ShockSeverity>(["LOW", "MODERATE", "HIGH", "CRITICAL"]);

export type ParsedEconomicPropagationSimulationQuery = {
  triggerType: string;
  territory?: string;
  severity?: ShockSeverity;
};

export function parseEconomicPropagationSimulationQuery(input: {
  triggerType?: string;
  territory?: string;
  severity?: string;
}): ParsedEconomicPropagationSimulationQuery {
  const triggerType = (input.triggerType ?? "shipment_delayed").trim();
  if (!triggerType) {
    throw new BadRequestException({ code: "economic_propagation_simulation_query_invalid", field: "triggerType" });
  }
  if (!SUPPORTED_SIMULATION_TRIGGERS.has(triggerType)) {
    throw new BadRequestException({ code: "economic_propagation_unknown_trigger", triggerType });
  }

  let territory: string | undefined = input.territory?.trim();
  if (territory) {
    const n = normalizeTerritoryLabel(territory);
    if (n.normalizedCode === "UNKNOWN") {
      throw new BadRequestException({ code: "economic_propagation_territory_unrecognized", territory });
    }
    territory = n.normalizedCode;
  }

  let severity: ShockSeverity | undefined;
  if (input.severity !== undefined && input.severity !== "") {
    const s = input.severity.trim() as ShockSeverity;
    if (!SEVERITY_VALUES.has(s)) {
      throw new BadRequestException({ code: "economic_propagation_invalid_severity", severity: input.severity });
    }
    severity = s;
  }

  return { triggerType, territory, severity };
}
