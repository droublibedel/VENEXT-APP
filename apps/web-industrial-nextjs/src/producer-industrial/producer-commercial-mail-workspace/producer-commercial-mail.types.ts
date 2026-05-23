import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { CommerceLinkedContext } from "commerce-messaging";

export type ProducerMailFolderId =
  | "inbox"
  | "sent"
  | "drafts"
  | "archived"
  | "priority"
  | "network"
  | "orders"
  | "settlements"
  | "documents";

export type ProducerMailPriority = "normal" | "high";

export type ProducerMailAttachmentKind = "pdf" | "xlsx" | "docx" | "csv" | "png" | "jpg";

export type ProducerMailAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
  kind: ProducerMailAttachmentKind;
  at: string;
  activityLabel?: string;
};

export type ProducerMailAddress = {
  email: string;
  name: string;
  role?: string;
};

export type ProducerMailMessage = {
  id: string;
  threadId: string;
  from: ProducerMailAddress;
  to: ProducerMailAddress[];
  cc?: ProducerMailAddress[];
  subject: string;
  body: string;
  at: string;
  attachments: ProducerMailAttachment[];
};

export type ProducerMailThread = {
  id: string;
  folder: ProducerMailFolderId;
  subject: string;
  preview: string;
  partnerName: string;
  partnerId?: string;
  from: ProducerMailAddress;
  to: ProducerMailAddress[];
  at: string;
  priority: ProducerMailPriority;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
  orderId?: string;
  orderReference?: string;
  settlementReference?: string;
  productIds?: string[];
  productNames?: string[];
  messages: ProducerMailMessage[];
  linkedContext?: CommerceLinkedContext | null;
};

export type ProducerMailDraft = {
  id: string;
  subject: string;
  body: string;
  to: string;
  cc: string;
  priority: ProducerMailPriority;
  orderId?: string;
  productIds: string[];
  savedAt: string;
};

export type ProducerCommercialMailView = {
  threads: ProducerMailThread[];
  drafts: ProducerMailDraft[];
  partners: { id: string; name: string; email: string }[];
  products: { id: string; name: string }[];
  orders: { id: string; reference: string; partner: string; amountLabel: string }[];
  settlements: { id: string; reference: string; partner: string; amountLabel: string; method: string }[];
  activitySummary: string;
};

export type ProducerMailPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  view: ProducerCommercialMailView | null;
};
