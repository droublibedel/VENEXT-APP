import type {
  RelationalCommercialOrder,
  RelationalOrderActorRole,
  RelationalOrderOrchestrationFlags,
  RelationalOrderOrchestrationView,
} from "./relational-order-orchestration.types";

const SCENARIO_A: RelationalCommercialOrder = {
  id: "ord-a-detaillant",
  reference: "CMD-2401-A",
  status: "SETTLEMENT_CONFIRMED",
  partner: {
    id: "sup-francois",
    displayName: "François",
    secondaryName: "La Rue de la Mode",
    city: "Abidjan",
    partnerType: "grossiste_b",
  },
  lines: [{ productId: "p1", productName: "Tissu wax premium", quantity: 12, priceLabel: "48 000 F" }],
  amountLabel: "48 000 F",
  updatedAt: "Aujourd'hui, 14h20",
  city: "Abidjan",
  settlement: {
    method: "cash",
    statusLabel: "Cash confirmé terrain",
    amountLabel: "48 000 F",
    optional: true,
  },
  links: { conversationId: "conv-a", activityId: "act-a" },
  scenarioId: "A",
};

const SCENARIO_B: RelationalCommercialOrder = {
  id: "ord-b-mobile",
  reference: "CMD-2401-B",
  status: "SETTLEMENT_PENDING",
  partner: {
    id: "sup-kouame",
    displayName: "Kouamé Distribution",
    city: "Bouaké",
    partnerType: "grossiste_b",
  },
  lines: [{ productId: "p2", productName: "Riz local 25kg", quantity: 8, priceLabel: "120 000 F" }],
  amountLabel: "120 000 F",
  updatedAt: "Aujourd'hui, 11h05",
  city: "Bouaké",
  settlement: {
    id: "tx-mm-01",
    method: "mobile-money",
    statusLabel: "Mobile money en attente",
    amountLabel: "120 000 F",
  },
  links: { conversationId: "conv-b", walletTransactionId: "tx-mm-01" },
  scenarioId: "B",
};

const SCENARIO_C: RelationalCommercialOrder = {
  id: "ord-c-producteur",
  reference: "CMD-2401-C",
  status: "PREPARING",
  partner: {
    id: "ga-agronexus",
    displayName: "Grossiste Agro Ouest",
    city: "San-Pédro",
    partnerType: "grossiste_a",
  },
  lines: [
    { productId: "p3", productName: "Cacao fèves grade A", quantity: 200, priceLabel: "2 400 000 F" },
  ],
  amountLabel: "2 400 000 F",
  updatedAt: "Hier, 16h40",
  city: "San-Pédro",
  settlement: {
    id: "tx-bank-01",
    method: "bank-transfer",
    statusLabel: "Virement en cours",
    amountLabel: "2 400 000 F",
  },
  links: { mailThreadId: "mail-c", conversationId: "conv-c", activityId: "act-c" },
  scenarioId: "C",
};

const SCENARIO_D: RelationalCommercialOrder = {
  id: "ord-d-incident",
  reference: "CMD-2401-D",
  status: "INCIDENT_REPORTED",
  partner: {
    id: "sup-terrain",
    displayName: "Boutique Horizon",
    city: "Yamoussoukro",
    partnerType: "detaillant",
  },
  lines: [{ productId: "p4", productName: "Huile palme 5L", quantity: 20, priceLabel: "85 000 F" }],
  amountLabel: "85 000 F",
  updatedAt: "Aujourd'hui, 09h15",
  city: "Yamoussoukro",
  incident: {
    kind: "delivery-delay",
    label: "Retard livraison",
    reportedAt: "Ce matin",
  },
  links: { conversationId: "conv-d" },
  scenarioId: "D",
};

const SCENARIO_E: RelationalCommercialOrder = {
  id: "ord-e-sponsor",
  reference: "CMD-2401-E",
  status: "IN_TRANSIT",
  partner: {
    id: "sup-corridor",
    displayName: "Corridor Sponsor CI",
    city: "Abidjan",
    partnerType: "grossiste_a",
  },
  lines: [{ productId: "p5", productName: "Ananas export", quantity: 50, priceLabel: "650 000 F" }],
  amountLabel: "650 000 F",
  updatedAt: "Aujourd'hui, 08h00",
  city: "Abidjan",
  sponsoredCorridor: true,
  links: { activityId: "act-corridor", conversationId: "conv-e" },
  scenarioId: "E",
};

const ALL_SCENARIOS = [SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D, SCENARIO_E];

function ordersForRole(role: RelationalOrderActorRole): RelationalCommercialOrder[] {
  switch (role) {
    case "detaillant":
      return [SCENARIO_A, SCENARIO_B];
    case "grossiste_b":
      return [SCENARIO_B, SCENARIO_D, SCENARIO_A];
    case "grossiste_a":
      return [SCENARIO_E, SCENARIO_D, SCENARIO_B];
    case "producteur":
      return [SCENARIO_C, SCENARIO_E, SCENARIO_D];
    default:
      return ALL_SCENARIOS;
  }
}

export function mockRelationalOrderView(
  role: RelationalOrderActorRole,
  _flags: RelationalOrderOrchestrationFlags = {},
): RelationalOrderOrchestrationView {
  const orders = ordersForRole(role);
  return {
    orders,
    activeOrderId: orders[0]?.id ?? null,
  };
}

export function getMockScenario(id: "A" | "B" | "C" | "D" | "E"): RelationalCommercialOrder | undefined {
  return ALL_SCENARIOS.find((o) => o.scenarioId === id);
}
