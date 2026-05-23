import type { EconomicShock } from "@venext/shared-contracts";

function pole(shock: EconomicShock): string {
  return shock.sourcePole.toLowerCase();
}

function typ(shock: EconomicShock): string {
  return shock.type.toLowerCase();
}

const SUPPLY_SHOCK_TYPES = new Set([
  "shipment_delayed",
  "distribution_fragility",
  "supply_chain_stress",
]);

const FINANCE_SHOCK_TYPES = new Set([
  "liquidity_collapse",
  "payment_instability",
  "territory_overheating",
  "cashflow_pressure",
]);

const RELATIONSHIP_SHOCK_TYPES = new Set(["relationship_fragmentation", "network_saturation"]);

const OPERATIONAL_SHOCK_TYPES = new Set(["negotiation_collapse", "campaign_overheating"]);

/** Controlled taxonomy for propagation shocks (Instruction 18.4A) — no ad hoc regex on type/sourcePole. */
export function isSupplyShock(shock: EconomicShock): boolean {
  if (pole(shock) === "supply_logistics") return true;
  return SUPPLY_SHOCK_TYPES.has(typ(shock));
}

export function isFinanceShock(shock: EconomicShock): boolean {
  if (pole(shock) === "finance_collections") return true;
  return FINANCE_SHOCK_TYPES.has(typ(shock));
}

export function isRelationshipShock(shock: EconomicShock): boolean {
  if (pole(shock) === "commercial_network") return true;
  return RELATIONSHIP_SHOCK_TYPES.has(typ(shock));
}

export function isStrategicShock(shock: EconomicShock): boolean {
  if (pole(shock) === "data_intelligence") return true;
  const t = typ(shock);
  return t.startsWith("data_intelligence_");
}

export function isOperationalShock(shock: EconomicShock): boolean {
  const p = pole(shock);
  if (p === "order_adv" || p === "marketing_activation") return true;
  return OPERATIONAL_SHOCK_TYPES.has(typ(shock));
}
