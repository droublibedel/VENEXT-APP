import type {
  CommercialActivityActorRole,
  CommercialActivityCategory,
  CommercialActivityContextLink,
  CommercialActivityEventType,
  CommercialActivityItem,
} from "./commercial-activity-feed.types";

export const COMMERCIAL_ACTIVITY_EVENT_TYPES: CommercialActivityEventType[] = [
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_COMPLETED",
  "DELIVERY_STARTED",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "RELATION_ESTABLISHED",
  "NEW_RELATIONAL_CATALOG",
  "SPONSORED_PRODUCT_VISIBLE",
  "PARTNER_ACTIVITY",
  "NETWORK_ACTIVITY",
  "MAIL_SENT",
  "MESSAGE_ACTIVITY",
  "WALLET_ACTIVATED",
  "WALLET_SECURED",
];

const FORBIDDEN_SOCIAL = ["like", "follow", "comment", "reaction", "viral", "trending", "view_count"];

export function categoryForActivity(type: CommercialActivityEventType): CommercialActivityCategory {
  const map: Record<CommercialActivityEventType, CommercialActivityCategory> = {
    ORDER_CREATED: "orders",
    ORDER_CONFIRMED: "orders",
    ORDER_COMPLETED: "orders",
    DELIVERY_STARTED: "deliveries",
    DELIVERY_CONFIRMED: "deliveries",
    SETTLEMENT_RECEIVED: "settlements",
    RELATION_ESTABLISHED: "partners",
    NEW_RELATIONAL_CATALOG: "catalogs",
    SPONSORED_PRODUCT_VISIBLE: "catalogs",
    PARTNER_ACTIVITY: "partners",
    NETWORK_ACTIVITY: "network",
    MAIL_SENT: "mails",
    MESSAGE_ACTIVITY: "messages",
    WALLET_ACTIVATED: "wallet",
    WALLET_SECURED: "wallet",
  };
  return map[type];
}

export function titleKeyForActivity(type: CommercialActivityEventType): string {
  return `activity.events.${type}`;
}

export function assertNotSocialActivity(meta: Record<string, string> = {}): boolean {
  const blob = JSON.stringify(meta).toLowerCase();
  return !FORBIDDEN_SOCIAL.some((w) => blob.includes(w));
}

export type CreateActivityInput = {
  eventType: CommercialActivityEventType;
  actorRole: CommercialActivityActorRole;
  organizationId: string;
  relationshipId?: string;
  partnerId?: string;
  occurredAt?: string;
  contextLink?: CommercialActivityContextLink;
  meta?: Record<string, string>;
};

export function createCommercialActivity(input: CreateActivityInput): CommercialActivityItem {
  if (!assertNotSocialActivity(input.meta)) {
    throw new Error("Activité sociale interdite — commerce relationnel uniquement.");
  }
  return {
    id: `act-${input.eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventType: input.eventType,
    category: categoryForActivity(input.eventType),
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    relationshipId: input.relationshipId,
    partnerId: input.partnerId,
    titleKey: titleKeyForActivity(input.eventType),
    summaryKey: `activity.summaries.${input.eventType}`,
    read: false,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    contextLink: input.contextLink,
    meta: input.meta,
  };
}

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export function buildDemoCommercialActivityFeed(
  actorRole: CommercialActivityActorRole,
  organizationId: string,
): CommercialActivityItem[] {
  const base = (eventType: CommercialActivityEventType, at: string, extra: Partial<CreateActivityInput> = {}) =>
    createCommercialActivity({
      eventType,
      actorRole,
      organizationId,
      occurredAt: at,
      ...extra,
    });

  if (actorRole === "PRODUCER") {
    return [
      base("NETWORK_ACTIVITY", hoursAgo(1), { relationshipId: "rel-producer-grossiste-a" }),
      base("MAIL_SENT", hoursAgo(3), {
        relationshipId: "rel-producer-grossiste-a",
        contextLink: { module: "mail", mailThreadId: "mail-ab-001", activeModule: "mail" },
      }),
      base("DELIVERY_CONFIRMED", hoursAgo(5), {
        relationshipId: "rel-producer-grossiste-a",
        contextLink: { module: "delivery", deliveryId: "delivery-ab", activeModule: "delivery" },
      }),
      base("SETTLEMENT_RECEIVED", hoursAgo(8), { relationshipId: "rel-producer-grossiste-a" }),
      base("NEW_RELATIONAL_CATALOG", daysAgo(2), { relationshipId: "rel-producer-grossiste-a" }),
    ];
  }
  if (actorRole === "GROSSISTE_A") {
    return [
      base("ORDER_CONFIRMED", hoursAgo(2), {
        relationshipId: "rel-producer-grossiste-a",
        contextLink: { module: "order", orderId: "ord-formal-1", activeModule: "order" },
      }),
      base("DELIVERY_STARTED", hoursAgo(4)),
      base("SETTLEMENT_RECEIVED", hoursAgo(6)),
      base("PARTNER_ACTIVITY", hoursAgo(10), { partnerId: "org-grossiste-b-demo" }),
      base("MAIL_SENT", daysAgo(1)),
    ];
  }
  if (actorRole === "GROSSISTE_B") {
    return [
      base("ORDER_CREATED", hoursAgo(0.5), {
        relationshipId: "rel-grossiste-b-detaillant-yop",
        contextLink: { module: "order", orderId: "order-bc-001", activeModule: "order" },
      }),
      base("MESSAGE_ACTIVITY", hoursAgo(1), {
        relationshipId: "rel-grossiste-b-detaillant-yop",
        contextLink: { module: "messaging", conversationId: "thread-bc-001", activeModule: "messaging" },
      }),
      base("DELIVERY_STARTED", hoursAgo(3)),
      base("SETTLEMENT_RECEIVED", hoursAgo(5)),
      base("NEW_RELATIONAL_CATALOG", hoursAgo(12)),
    ];
  }
  return [
    base("ORDER_CONFIRMED", hoursAgo(1), {
      relationshipId: "rel-grossiste-b-detaillant-yop",
      contextLink: { module: "order", orderId: "order-bc-001", activeModule: "order" },
    }),
    base("DELIVERY_CONFIRMED", hoursAgo(4)),
    base("MESSAGE_ACTIVITY", hoursAgo(6)),
    base("NEW_RELATIONAL_CATALOG", hoursAgo(9)),
    base("WALLET_ACTIVATED", daysAgo(3)),
  ];
}
