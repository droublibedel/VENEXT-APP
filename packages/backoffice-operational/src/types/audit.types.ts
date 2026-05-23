export type BackofficeInternalAuditEntry = {
  id: string;
  at: string;
  actorEmail: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string;
  metadata?: Record<string, unknown>;
};
