import type { CommercialContextReference } from "commercial-context-routing";

export type CommerceNotificationEventType =
  | "ORDER_CREATED"
  | "ORDER_VALIDATED"
  | "ORDER_UPDATED"
  | "DELIVERY_STARTED"
  | "DELIVERY_NEAR"
  | "DELIVERY_CONFIRMED"
  | "SETTLEMENT_RECEIVED"
  | "SETTLEMENT_PENDING"
  | "WALLET_SECURED"
  | "WALLET_LOCKED"
  | "MESSAGE_RECEIVED"
  | "MAIL_RECEIVED"
  | "RELATION_REQUEST"
  | "RELATION_ACCEPTED"
  | "CATALOG_AVAILABLE"
  | "SPONSORED_CATALOG_AVAILABLE"
  | "CONTEXT_RETURN_AVAILABLE";

export type CommerceNotificationPriority = "LOW" | "NORMAL" | "IMPORTANT" | "URGENT";

export type CommerceActorRole =
  | "PRODUCER"
  | "GROSSISTE_A"
  | "GROSSISTE_B"
  | "DETAILLANT";

export type CommerceNotificationCategory =
  | "orders"
  | "deliveries"
  | "settlements"
  | "messages"
  | "mails"
  | "relations"
  | "catalogs"
  | "wallet"
  | "context";

export type CommerceNotificationPreferences = {
  orders: boolean;
  deliveries: boolean;
  settlements: boolean;
  messages: boolean;
  mails: boolean;
  relations: boolean;
  catalogs: boolean;
  walletSecurity: boolean;
  sponsoredCatalogs: boolean;
};

export type CommerceNotificationContextLink = CommercialContextReference & {
  module: NonNullable<CommercialContextReference["activeModule"]>;
};

export type CommerceNotification = {
  id: string;
  eventType: CommerceNotificationEventType;
  priority: CommerceNotificationPriority;
  category: CommerceNotificationCategory;
  actorRole: CommerceActorRole;
  organizationId: string;
  titleKey: string;
  bodyKey?: string;
  read: boolean;
  createdAt: string;
  contextLink?: CommerceNotificationContextLink;
  meta?: Record<string, string>;
};

export type CommerceNotificationsEnvelope<T> = {
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  devBadge?: boolean;
  payload: T;
};

export type CommerceNotificationsFlags = {
  commerce_notifications_enabled?: boolean;
  commerce_notification_preferences_enabled?: boolean;
  commerce_notification_context_routing_enabled?: boolean;
  venext_bff_routes_enabled?: boolean;
  venext_live_data_fallback_enabled?: boolean;
};

export type CommerceNotificationsLiveState = {
  notifications: CommerceNotification[];
  unreadCount: number;
  preferences: CommerceNotificationPreferences;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  updatePreferences: (patch: Partial<CommerceNotificationPreferences>) => Promise<void>;
};
