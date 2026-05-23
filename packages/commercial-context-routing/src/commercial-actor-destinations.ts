import type { CommercialActorRole } from "commercial-relationship-governance";

import type { CommercialContextReference } from "./commercial-context-routing.types";
import type { CommercialScreenIntent } from "./commercial-screen-intent";

export type GrossisteBTabDestination =
  | "activity"
  | "messaging"
  | "wallet"
  | "catalog"
  | "orders"
  | "network"
  | "profile";

export type GrossisteAWorkspaceDestination =
  | "overview"
  | "network"
  | "commerce-messaging"
  | "commerce-wallet"
  | "orders"
  | "distribution"
  | "catalog"
  | "territory"
  | "finance"
  | "intelligence"
  | "governance";

export type DetaillantTabDestination =
  | "home"
  | "messaging"
  | "products"
  | "orders"
  | "network"
  | "account";

export type ProducerPoleDestination =
  | "relational-commercial"
  | "producer-commercial-mail-workspace"
  | "order-fulfillment"
  | "finance-collections-workspace"
  | "professional-commercial-network-workspace"
  | "catalog-products";

export type ProducerWorkspaceTabDestination =
  | "partners"
  | "orders"
  | "corridors"
  | "activity"
  | "products"
  | "territory"
  | "insights";

export type ActorScreenDestination =
  | { actor: "grossiste_b"; screen: GrossisteBTabDestination; subTab?: never }
  | { actor: "grossiste_a"; screen: GrossisteAWorkspaceDestination; subTab?: never }
  | { actor: "detaillant"; screen: DetaillantTabDestination; subTab?: never }
  | {
      actor: "producteur";
      screen: ProducerPoleDestination;
      subTab?: ProducerWorkspaceTabDestination;
    };

const GROSSISTE_B_MAP: Record<CommercialScreenIntent, GrossisteBTabDestination> = {
  "view-order": "orders",
  "view-delivery": "activity",
  "view-settlement": "wallet",
  "view-conversation": "messaging",
  "view-mail-thread": "messaging",
  "view-activity": "activity",
  "view-catalog": "catalog",
};

const GROSSISTE_A_MAP: Record<CommercialScreenIntent, GrossisteAWorkspaceDestination> = {
  "view-order": "orders",
  "view-delivery": "distribution",
  "view-settlement": "commerce-wallet",
  "view-conversation": "commerce-messaging",
  "view-mail-thread": "network",
  "view-activity": "territory",
  "view-catalog": "catalog",
};

const DETAILLANT_MAP: Record<CommercialScreenIntent, DetaillantTabDestination> = {
  "view-order": "orders",
  "view-delivery": "orders",
  "view-settlement": "account",
  "view-conversation": "messaging",
  "view-mail-thread": "messaging",
  "view-activity": "home",
  "view-catalog": "products",
};

const PRODUCER_POLE_MAP: Record<CommercialScreenIntent, ProducerPoleDestination> = {
  "view-order": "relational-commercial",
  "view-delivery": "order-fulfillment",
  "view-settlement": "finance-collections-workspace",
  "view-conversation": "professional-commercial-network-workspace",
  "view-mail-thread": "producer-commercial-mail-workspace",
  "view-activity": "relational-commercial",
  "view-catalog": "catalog-products",
};

const PRODUCER_SUBTAB_MAP: Partial<Record<CommercialScreenIntent, ProducerWorkspaceTabDestination>> = {
  "view-order": "orders",
  "view-activity": "activity",
  "view-catalog": "products",
};

export function resolveActorScreenDestination(
  actor: CommercialActorRole,
  screenIntent: CommercialScreenIntent,
): ActorScreenDestination | null {
  switch (actor) {
    case "grossiste_b": {
      const screen = GROSSISTE_B_MAP[screenIntent];
      return screen ? { actor: "grossiste_b", screen } : null;
    }
    case "grossiste_a": {
      const screen = GROSSISTE_A_MAP[screenIntent];
      return screen ? { actor: "grossiste_a", screen } : null;
    }
    case "detaillant": {
      const screen = DETAILLANT_MAP[screenIntent];
      return screen ? { actor: "detaillant", screen } : null;
    }
    case "producteur": {
      const screen = PRODUCER_POLE_MAP[screenIntent];
      if (!screen) return null;
      const subTab = PRODUCER_SUBTAB_MAP[screenIntent];
      return { actor: "producteur", screen, subTab };
    }
    default:
      return null;
  }
}

export function destinationUsesMessagingNotMail(
  actor: CommercialActorRole,
  screenIntent: CommercialScreenIntent,
): boolean {
  if (screenIntent !== "view-mail-thread") return false;
  return actor === "grossiste_b" || actor === "detaillant";
}

export type ScreenNavigationPayload = {
  screenIntent: CommercialScreenIntent;
  reference: CommercialContextReference;
  destination: ActorScreenDestination;
  label: string;
};
