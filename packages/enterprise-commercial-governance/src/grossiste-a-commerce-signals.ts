import type { GrossisteACanonicalPole } from "./grossiste-a-canonical-poles";

export type SharedCommerceSignal = {
  id: string;
  kind: "order_late" | "partner_inactive" | "settlement_pending" | "delivery_delay" | "relation_pending";
  message: string;
  poles: GrossisteACanonicalPole[];
};

export function buildSharedCommerceSignals(input: {
  lateOrderCount?: number;
  pendingOrders?: number;
  pendingSettlements?: number;
  delayedDeliveries?: number;
  inactivePartners?: number;
}): SharedCommerceSignal[] {
  const signals: SharedCommerceSignal[] = [];

  if ((input.lateOrderCount ?? 0) > 0) {
    signals.push({
      id: "sig-late-order",
      kind: "order_late",
      message: `${input.lateOrderCount} commande(s) légèrement en retard`,
      poles: ["COMMANDES_ADV", "LIVRAISON_RECEPTION", "PILOTAGE_COMMERCIAL"],
    });
  }
  if ((input.pendingOrders ?? 0) > 0) {
    signals.push({
      id: "sig-pending-order",
      kind: "order_late",
      message: `${input.pendingOrders} commande(s) en attente de validation`,
      poles: ["COMMANDES_ADV", "PILOTAGE_COMMERCIAL"],
    });
  }
  if ((input.pendingSettlements ?? 0) > 0) {
    signals.push({
      id: "sig-settlement",
      kind: "settlement_pending",
      message: `${input.pendingSettlements} règlement(s) attendu(s)`,
      poles: ["FINANCE_REGLEMENTS", "PILOTAGE_COMMERCIAL"],
    });
  }
  if ((input.delayedDeliveries ?? 0) > 0) {
    signals.push({
      id: "sig-delivery",
      kind: "delivery_delay",
      message: `${input.delayedDeliveries} livraison(s) en cours de rattrapage`,
      poles: ["LIVRAISON_RECEPTION", "COMMANDES_ADV"],
    });
  }
  if ((input.inactivePartners ?? 0) > 0) {
    signals.push({
      id: "sig-inactive",
      kind: "partner_inactive",
      message: `${input.inactivePartners} partenaire(s) peu actifs cette semaine`,
      poles: ["RESEAU_DISTRIBUTION", "PILOTAGE_COMMERCIAL", "RELATIONS_PARTENAIRES"],
    });
  }

  return signals;
}

export function signalsForPole(
  pole: GrossisteACanonicalPole,
  shared: SharedCommerceSignal[],
): SharedCommerceSignal[] {
  return shared.filter((s) => s.poles.includes(pole));
}

export function assertCrossPoleCoherence(shared: SharedCommerceSignal[]): boolean {
  const late = shared.find((s) => s.kind === "order_late");
  if (!late) return true;
  return late.poles.includes("COMMANDES_ADV") && late.poles.includes("LIVRAISON_RECEPTION");
}
