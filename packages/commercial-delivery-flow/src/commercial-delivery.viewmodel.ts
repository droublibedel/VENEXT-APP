import type {
  CommercialDelivery,
  CommercialDeliveryActorRole,
  CommercialDeliveryFlowFlags,
  CommercialDeliveryFlowView,
} from "./commercial-delivery-flow.types";

const SCENARIO_A: CommercialDelivery = {
  id: "del-a-detaillant",
  reference: "LIV-2401-A",
  status: "ARRIVING",
  partner: { id: "p-francois", displayName: "François", secondaryName: "La Rue de la Mode", city: "Abidjan" },
  route: { originCity: "Marcory", destinationCity: "Cocody", corridorLabel: "Abidjan intra" },
  amountLabel: "48 000 F",
  updatedAt: "À l'instant",
  settlement: { method: "cash", statusLabel: "Cash en attente", amountLabel: "48 000 F" },
  links: { orderId: "ord-a", orderReference: "CMD-2401-A", conversationId: "conv-a" },
  scenarioId: "A",
};

const SCENARIO_B: CommercialDelivery = {
  id: "del-b-mm",
  reference: "LIV-2401-B",
  status: "RECEPTION_CONFIRMED",
  partner: { id: "p-kouame", displayName: "Kouamé Distribution", city: "Bouaké" },
  route: { originCity: "Bouaké", destinationCity: "Korhogo" },
  amountLabel: "120 000 F",
  settlement: { method: "mobile-money", statusLabel: "Mobile money confirmé", amountLabel: "120 000 F" },
  updatedAt: "Aujourd'hui, 10h30",
  links: { orderId: "ord-b", conversationId: "conv-b", walletTransactionId: "tx-mm-02" },
  scenarioId: "B",
};

const SCENARIO_C: CommercialDelivery = {
  id: "del-c-corridor",
  reference: "LIV-2401-C",
  status: "PREPARING_LOADING",
  partner: { id: "p-ga", displayName: "Grossiste Agro Ouest", city: "San-Pédro" },
  route: {
    originCity: "Abidjan",
    destinationCity: "Bouaké",
    corridorLabel: "Abidjan → Bouaké",
  },
  amountLabel: "2 400 000 F",
  updatedAt: "Hier, 17h00",
  links: { orderId: "ord-c", mailThreadId: "mail-c", activityId: "act-c" },
  scenarioId: "C",
};

const SCENARIO_D: CommercialDelivery = {
  id: "del-d-delay",
  reference: "LIV-2401-D",
  status: "DELIVERY_DELAYED",
  partner: { id: "p-horizon", displayName: "Boutique Horizon", city: "Yamoussoukro" },
  route: { originCity: "Abidjan", destinationCity: "Yamoussoukro" },
  amountLabel: "85 000 F",
  updatedAt: "Ce matin",
  incident: { kind: "delay", label: "Retard", reportedAt: "Ce matin" },
  links: { orderId: "ord-d", conversationId: "conv-d" },
  scenarioId: "D",
};

const SCENARIO_E: CommercialDelivery = {
  id: "del-e-sponsor",
  reference: "LIV-2401-E",
  status: "ON_THE_WAY",
  partner: { id: "p-corridor", displayName: "Corridor Sponsor CI", city: "Abidjan" },
  route: { originCity: "Port", destinationCity: "Entrepôt Nord", corridorLabel: "Sponsor corridor" },
  amountLabel: "650 000 F",
  updatedAt: "Aujourd'hui, 07h45",
  sponsoredCorridor: true,
  links: { orderId: "ord-e", activityId: "act-corridor", conversationId: "conv-e" },
  scenarioId: "E",
};

const ALL = [SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D, SCENARIO_E];

function deliveriesForRole(role: CommercialDeliveryActorRole): CommercialDelivery[] {
  switch (role) {
    case "detaillant":
      return [SCENARIO_A, SCENARIO_B];
    case "grossiste_b":
      return [SCENARIO_E, SCENARIO_D, SCENARIO_A];
    case "grossiste_a":
      return [SCENARIO_E, SCENARIO_B, SCENARIO_D];
    case "producteur":
      return [SCENARIO_C, SCENARIO_E, SCENARIO_D];
    default:
      return ALL;
  }
}

export function mockCommercialDeliveryView(
  role: CommercialDeliveryActorRole,
  _flags: CommercialDeliveryFlowFlags = {},
): CommercialDeliveryFlowView {
  const deliveries = deliveriesForRole(role);
  return { deliveries, activeDeliveryId: deliveries[0]?.id ?? null };
}

export function getMockDeliveryScenario(
  id: "A" | "B" | "C" | "D" | "E",
): CommercialDelivery | undefined {
  return ALL.find((d) => d.scenarioId === id);
}
