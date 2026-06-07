export type ActorEconomicRole = "PRODUCER" | "WHOLESALER" | "RETAILER";

export type ActorEconomicLanes = {
  role: ActorEconomicRole;
  hasCatalogue: boolean;
  hasMarket: boolean;
  displayRoleLabel: string;
};

const LANES: Record<ActorEconomicRole, ActorEconomicLanes> = {
  PRODUCER: {
    role: "PRODUCER",
    hasCatalogue: true,
    hasMarket: false,
    displayRoleLabel: "Producteur",
  },
  WHOLESALER: {
    role: "WHOLESALER",
    hasCatalogue: true,
    hasMarket: true,
    displayRoleLabel: "Grossiste",
  },
  RETAILER: {
    role: "RETAILER",
    hasCatalogue: false,
    hasMarket: true,
    displayRoleLabel: "Détaillant",
  },
};

export function resolveActorEconomicRole(input: string): ActorEconomicRole | null {
  const normalized = input.trim().toUpperCase().replace("-", "_");
  if (normalized === "PRODUCER" || normalized === "PRODUCTEUR") return "PRODUCER";
  if (
    normalized === "WHOLESALER"
    || normalized === "GROSSISTE"
    || normalized === "GROSSISTE_A"
    || normalized === "GROSSISTE_B"
  ) {
    return "WHOLESALER";
  }
  if (normalized === "RETAILER" || normalized === "DETAILLANT") return "RETAILER";
  return null;
}

export function resolveActorEconomicLanes(input: string): ActorEconomicLanes | null {
  const role = resolveActorEconomicRole(input);
  return role ? LANES[role] : null;
}

export function assertCatalogueAccess(actorRole: string): { allowed: boolean; code?: string } {
  const lanes = resolveActorEconomicLanes(actorRole);
  if (!lanes) return { allowed: false, code: "unknown_actor" };
  if (!lanes.hasCatalogue) return { allowed: false, code: "catalogue_forbidden" };
  return { allowed: true };
}

export function assertMarketAccess(actorRole: string): { allowed: boolean; code?: string } {
  const lanes = resolveActorEconomicLanes(actorRole);
  if (!lanes) return { allowed: false, code: "unknown_actor" };
  if (!lanes.hasMarket) return { allowed: false, code: "market_forbidden" };
  return { allowed: true };
}

export function sanitizeActorDisplayLabel(label: string): string {
  return label
    .replace(/grossiste\s*b/gi, "Grossiste")
    .replace(/grossiste\s*a/gi, "Grossiste")
    .replace(/Grossiste B/g, "Grossiste")
    .replace(/Grossiste A/g, "Grossiste");
}

export type CommerceTransferAnalyticsEvent =
  | "product_transferred_to_catalogue"
  | "inherited_product_modified"
  | "supplier_product_reshared"
  | "catalogue_growth_from_market"
  | "market_conversion_to_catalogue";

export function buildTransferAnalyticsPayload(
  event: CommerceTransferAnalyticsEvent,
  detail: Record<string, unknown> = {},
): Record<string, unknown> {
  return { event, at: new Date().toISOString(), ...detail };
}
