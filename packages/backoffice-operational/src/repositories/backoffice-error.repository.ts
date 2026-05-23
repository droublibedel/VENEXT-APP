import type { BackofficeErrorEvent } from "../types/error.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma, toPrismaJson } from "../persistence/prisma.js";
import { mapErrorFromPrisma } from "../persistence/mappers.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export class BackofficeErrorRepository {
  async create(
    event: Omit<BackofficeErrorEvent, "id" | "occurredAt" | "treatmentStatus"> & {
      id?: string;
      occurredAt?: string;
      treatmentStatus?: BackofficeErrorEvent["treatmentStatus"];
    },
  ): Promise<BackofficeErrorEvent> {
    const mode = resolveBackofficePersistenceMode();
    const row: BackofficeErrorEvent = {
      id: event.id ?? crypto.randomUUID(),
      occurredAt: event.occurredAt ?? new Date().toISOString(),
      treatmentStatus: event.treatmentStatus ?? "NEW",
      ...event,
    } as BackofficeErrorEvent;

    if (mode === "FALLBACK") {
      return getBackofficeStore().addError(event);
    }

    try {
      const prisma = getBackofficePrisma();
      const saved = await prisma.backofficeErrorEventRecord.create({
        data: {
          id: row.id,
          occurredAt: new Date(row.occurredAt),
          userId: row.userId,
          userPhone: row.userPhone,
          userEmail: row.userEmail,
          actorId: row.actorId,
          actorRole: row.actorRole,
          application: row.application,
          screen: row.screen,
          action: row.action,
          userFacingMessage: row.userFacingMessage,
          technicalMessage: row.technicalMessage,
          internalStack: row.internalStack,
          errorType: row.errorType,
          severity: row.severity,
          treatmentStatus: row.treatmentStatus,
          commercialContext: toPrismaJson(row.commercialContext),
          device: row.device,
          userAgent: row.userAgent,
          networkHint: row.networkHint,
          routeOrApi: row.routeOrApi,
          module: row.module,
          journeyId: row.journeyId,
        },
      });
      const mapped = mapErrorFromPrisma(saved);
      if (mode === "HYBRID") getBackofficeStore().addError(mapped);
      return mapped;
    } catch {
      if (mode === "HYBRID") return getBackofficeStore().addError(event);
      throw new Error("backoffice_error_persist_failed");
    }
  }

  async list(opts: {
    status?: string;
    application?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedResult<BackofficeErrorEvent>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      let rows = getBackofficeStore().errors;
      if (opts.status) rows = rows.filter((e) => e.treatmentStatus === opts.status);
      if (opts.application) rows = rows.filter((e) => e.application === opts.application);
      return paginate(rows, opts.page, opts.pageSize);
    }

    try {
      const prisma = getBackofficePrisma();
      const where = {
        archivedAt: null,
        ...(opts.status ? { treatmentStatus: opts.status as BackofficeErrorEvent["treatmentStatus"] } : {}),
        ...(opts.application ? { application: opts.application } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.backofficeErrorEventRecord.count({ where }),
        prisma.backofficeErrorEventRecord.findMany({
          where,
          orderBy: { occurredAt: "desc" },
          take: opts.pageSize ?? 50,
          skip: ((opts.page ?? 1) - 1) * (opts.pageSize ?? 50),
        }),
      ]);
      const items = rows.map(mapErrorFromPrisma);
      return {
        items,
        total,
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 50,
        hasMore: (opts.page ?? 1) * (opts.pageSize ?? 50) < total,
      };
    } catch {
      if (mode === "HYBRID") {
        let rows = getBackofficeStore().errors;
        if (opts.status) rows = rows.filter((e) => e.treatmentStatus === opts.status);
        return paginate(rows, opts.page, opts.pageSize);
      }
      return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    }
  }

  async getById(id: string): Promise<BackofficeErrorEvent | null> {
    const mem = getBackofficeStore().errors.find((e) => e.id === id);
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return mem ?? null;

    try {
      const row = await getBackofficePrisma().backofficeErrorEventRecord.findFirst({
        where: { id, archivedAt: null },
      });
      if (row) return mapErrorFromPrisma(row);
    } catch {
      if (mode === "HYBRID") return mem ?? null;
    }
    return mem ?? null;
  }

  async updateStatus(
    id: string,
    status: BackofficeErrorEvent["treatmentStatus"],
    note?: string,
  ): Promise<BackofficeErrorEvent | null> {
    const mem = getBackofficeStore().errors.find((e) => e.id === id);
    if (mem) mem.treatmentStatus = status;

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return mem ?? null;

    try {
      const row = await getBackofficePrisma().backofficeErrorEventRecord.update({
        where: { id },
        data: { treatmentStatus: status },
      });
      if (note && mem) {
        mem.commercialContext = { ...mem.commercialContext, treatmentNote: note };
      }
      return mapErrorFromPrisma(row);
    } catch {
      return mem ?? null;
    }
  }
}

let singleton: BackofficeErrorRepository | null = null;
export function getBackofficeErrorRepository(): BackofficeErrorRepository {
  if (!singleton) singleton = new BackofficeErrorRepository();
  return singleton;
}
