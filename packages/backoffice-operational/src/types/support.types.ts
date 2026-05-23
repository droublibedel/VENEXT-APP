export type SupportPriority = "LOW" | "NORMAL" | "IMPORTANT" | "URGENT";

export type SupportSource =
  | "AUTO_ERROR"
  | "AUTO_JOURNEY"
  | "MANUAL"
  | "SECURITY_ALERT"
  | "ONBOARDING"
  | "PAYMENT_WALLET"
  | "ORDER";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";

export type BackofficeSupportTicket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  priority: SupportPriority;
  source: SupportSource;
  status: SupportTicketStatus;
  title: string;
  summary: string;
  userId?: string;
  userPhone?: string;
  enterpriseId?: string;
  linkedErrorEventId?: string;
  linkedJourneyId?: string;
  assignee?: string;
  note?: string;
  suggestion?: string;
};
