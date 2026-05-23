import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import { mapJourneyFromPrisma } from "../persistence/mappers.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export class BackofficeJourneyRepository {
  async upsert(journey: BackofficeJourneyInstance): Promise<BackofficeJourneyInstance> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      const store = getBackofficeStore();
      const existing = store.findJourney(journey.journeyId);
      if (existing) store.updateJourney(journey.journeyId, journey);
      else store.addJourney(journey);
      return journey;
    }

    try {
      const prisma = getBackofficePrisma();
      const saved = await prisma.backofficeJourneyInstanceRecord.upsert({
        where: { journeyId: journey.journeyId },
        create: {
          journeyId: journey.journeyId,
          journeyKey: journey.journeyKey,
          actorId: journey.actorId,
          actorRole: journey.actorRole,
          application: journey.application,
          startedAt: new Date(journey.startedAt),
          lastStepAt: new Date(journey.lastStepAt),
          completedAt: journey.completedAt ? new Date(journey.completedAt) : null,
          currentStep: journey.currentStep,
          expectedNextStep: journey.expectedNextStep,
          status: journey.status,
          failureReason: journey.failureReason,
          linkedErrorEventId: journey.linkedErrorEventId,
          userId: journey.userId,
          userPhone: journey.userPhone,
          userEmail: journey.userEmail,
          retryCount: journey.retryCount ?? 0,
        },
        update: {
          lastStepAt: new Date(journey.lastStepAt),
          completedAt: journey.completedAt ? new Date(journey.completedAt) : null,
          currentStep: journey.currentStep,
          expectedNextStep: journey.expectedNextStep,
          status: journey.status,
          failureReason: journey.failureReason,
          linkedErrorEventId: journey.linkedErrorEventId,
          retryCount: journey.retryCount ?? 0,
        },
      });
      const mapped = mapJourneyFromPrisma(saved);
      if (mode === "HYBRID") {
        const store = getBackofficeStore();
        const existing = store.findJourney(journey.journeyId);
        if (existing) store.updateJourney(journey.journeyId, mapped);
        else store.addJourney(mapped);
      }
      return mapped;
    } catch {
      if (mode === "HYBRID") {
        const store = getBackofficeStore();
        store.addJourney(journey);
        return journey;
      }
      throw new Error("backoffice_journey_persist_failed");
    }
  }

  async list(opts: {
    status?: string;
    journeyKey?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedResult<BackofficeJourneyInstance>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      let rows = getBackofficeStore().journeys;
      if (opts.status) rows = rows.filter((j) => j.status === opts.status);
      if (opts.journeyKey) rows = rows.filter((j) => j.journeyKey === opts.journeyKey);
      return paginate(rows, opts.page, opts.pageSize);
    }

    try {
      const prisma = getBackofficePrisma();
      const where = {
        archivedAt: null,
        ...(opts.status ? { status: opts.status as BackofficeJourneyInstance["status"] } : {}),
        ...(opts.journeyKey ? { journeyKey: opts.journeyKey } : {}),
      };
      const page = opts.page ?? 1;
      const pageSize = opts.pageSize ?? 50;
      const [total, rows] = await Promise.all([
        prisma.backofficeJourneyInstanceRecord.count({ where }),
        prisma.backofficeJourneyInstanceRecord.findMany({
          where,
          orderBy: { lastStepAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
      ]);
      return {
        items: rows.map(mapJourneyFromPrisma),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    } catch {
      if (mode === "HYBRID") {
        let rows = getBackofficeStore().journeys;
        if (opts.status) rows = rows.filter((j) => j.status === opts.status);
        return paginate(rows, opts.page, opts.pageSize);
      }
      return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    }
  }

  async getById(journeyId: string): Promise<BackofficeJourneyInstance | null> {
    const mem = getBackofficeStore().findJourney(journeyId);
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return mem ?? null;

    try {
      const row = await getBackofficePrisma().backofficeJourneyInstanceRecord.findFirst({
        where: { journeyId, archivedAt: null },
      });
      if (row) return mapJourneyFromPrisma(row);
    } catch {
      if (mode === "HYBRID") return mem ?? null;
    }
    return mem ?? null;
  }
}

let singleton: BackofficeJourneyRepository | null = null;
export function getBackofficeJourneyRepository(): BackofficeJourneyRepository {
  if (!singleton) singleton = new BackofficeJourneyRepository();
  return singleton;
}
