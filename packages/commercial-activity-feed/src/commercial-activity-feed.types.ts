import type { CommercialContextReference } from "commercial-context-routing";

export type CommercialActivityEventType =
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "ORDER_COMPLETED"
  | "DELIVERY_STARTED"
  | "DELIVERY_CONFIRMED"
  | "SETTLEMENT_RECEIVED"
  | "RELATION_ESTABLISHED"
  | "NEW_RELATIONAL_CATALOG"
  | "SPONSORED_PRODUCT_VISIBLE"
  | "PARTNER_ACTIVITY"
  | "NETWORK_ACTIVITY"
  | "MAIL_SENT"
  | "MESSAGE_ACTIVITY"
  | "WALLET_ACTIVATED"
  | "WALLET_SECURED";

export type CommercialActivityActorRole =
  | "PRODUCER"
  | "GROSSISTE_A"
  | "GROSSISTE_B"
  | "DETAILLANT";

export type CommercialActivityCategory =
  | "orders"
  | "deliveries"
  | "settlements"
  | "catalogs"
  | "partners"
  | "messages"
  | "mails"
  | "wallet"
  | "network";

export type CommercialActivityFilter = CommercialActivityCategory | "all";

export type CommercialActivityTimelineBucket = "today" | "yesterday" | "this_week" | "older";

export type CommercialActivityContextLink = CommercialContextReference & {
  module: NonNullable<CommercialContextReference["activeModule"]>;
};

export type CommercialActivityItem = {
  id: string;
  eventType: CommercialActivityEventType;
  category: CommercialActivityCategory;
  actorRole: CommercialActivityActorRole;
  organizationId: string;
  relationshipId?: string;
  partnerId?: string;
  titleKey: string;
  summaryKey?: string;
  read: boolean;
  occurredAt: string;
  contextLink?: CommercialActivityContextLink;
  meta?: Record<string, string>;
};

export type CommercialActivityGroup = {
  id: string;
  category: CommercialActivityCategory;
  labelKey: string;
  count: number;
  items: CommercialActivityItem[];
  latestAt: string;
};

export type CommercialActivityTimelineSection = {
  bucket: CommercialActivityTimelineBucket;
  labelKey: string;
  groups: CommercialActivityGroup[];
  items: CommercialActivityItem[];
};

export type CommercialActivitySummary = {
  organizationId: string;
  totalToday: number;
  ordersToday: number;
  deliveriesToday: number;
  partnersActive: number;
  headlineKey: string;
};

export type CommercialActivityFeedEnvelope<T> = {
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  devBadge?: boolean;
  payload: T;
};

export type CommercialActivityFeedFlags = {
  commercial_activity_feed_enabled?: boolean;
  commercial_activity_timeline_enabled?: boolean;
  commercial_activity_grouping_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  venext_bff_routes_enabled?: boolean;
  venext_live_data_fallback_enabled?: boolean;
};

export type CommercialActivityFeedState = {
  items: CommercialActivityItem[];
  timeline: CommercialActivityTimelineSection[];
  groups: CommercialActivityGroup[];
  summary: CommercialActivitySummary | null;
  filter: CommercialActivityFilter;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  refresh: () => void;
  setFilter: (f: CommercialActivityFilter) => void;
  markRead: (id: string) => Promise<void>;
};

export const COMMERCIAL_ACTIVITY_MAX_HISTORY_DAYS = 30;

export const COMMERCIAL_ACTIVITY_FEED_POLLING_MS = 0;
