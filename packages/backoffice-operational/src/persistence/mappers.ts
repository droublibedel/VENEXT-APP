import type {
  BackofficeErrorEventRecord,
  BackofficeJourneyInstanceRecord,
  BackofficeSupportTicketRecord,
} from "@prisma/client";

import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import type { BackofficeSupportTicket, SupportPriority } from "../types/support.types.js";

export function mapErrorFromPrisma(row: BackofficeErrorEventRecord): BackofficeErrorEvent {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    userId: row.userId ?? undefined,
    userPhone: row.userPhone ?? undefined,
    userEmail: row.userEmail ?? undefined,
    actorId: row.actorId ?? undefined,
    actorRole: row.actorRole ?? undefined,
    application: row.application,
    screen: row.screen ?? undefined,
    action: row.action ?? undefined,
    userFacingMessage: row.userFacingMessage,
    technicalMessage: row.technicalMessage,
    internalStack: row.internalStack ?? undefined,
    errorType: row.errorType as BackofficeErrorEvent["errorType"],
    severity: row.severity as BackofficeErrorEvent["severity"],
    treatmentStatus: row.treatmentStatus as BackofficeErrorEvent["treatmentStatus"],
    commercialContext: (row.commercialContext as Record<string, unknown>) ?? {},
    device: row.device ?? undefined,
    userAgent: row.userAgent ?? undefined,
    networkHint: row.networkHint ?? undefined,
    routeOrApi: row.routeOrApi ?? undefined,
    module: row.module ?? undefined,
    journeyId: row.journeyId ?? undefined,
  };
}

export function mapJourneyFromPrisma(row: BackofficeJourneyInstanceRecord): BackofficeJourneyInstance {
  return {
    journeyId: row.journeyId,
    journeyKey: row.journeyKey,
    actorId: row.actorId,
    actorRole: row.actorRole,
    application: row.application,
    startedAt: row.startedAt.toISOString(),
    lastStepAt: row.lastStepAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    currentStep: row.currentStep,
    expectedNextStep: row.expectedNextStep ?? undefined,
    status: row.status as BackofficeJourneyInstance["status"],
    failureReason: (row.failureReason as BackofficeJourneyInstance["failureReason"]) ?? undefined,
    linkedErrorEventId: row.linkedErrorEventId ?? undefined,
    userId: row.userId ?? undefined,
    userPhone: row.userPhone ?? undefined,
    userEmail: row.userEmail ?? undefined,
    retryCount: row.retryCount,
  };
}

export function mapSupportFromPrisma(row: BackofficeSupportTicketRecord): BackofficeSupportTicket {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    priority: row.priority as SupportPriority,
    source: row.source as BackofficeSupportTicket["source"],
    status: row.status as BackofficeSupportTicket["status"],
    title: row.title,
    summary: row.summary,
    userId: row.userId ?? undefined,
    userPhone: row.userPhone ?? undefined,
    enterpriseId: row.enterpriseId ?? undefined,
    linkedErrorEventId: row.linkedErrorEventId ?? undefined,
    linkedJourneyId: row.linkedJourneyId ?? undefined,
    assignee: row.assignee ?? undefined,
    note: row.note ?? undefined,
    suggestion: row.suggestion ?? undefined,
  };
}
