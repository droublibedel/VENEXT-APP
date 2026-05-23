import type { BackofficeSupportTicket } from "../types/support.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import { mapSupportFromPrisma } from "../persistence/mappers.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export class BackofficeSupportRepository {
  async create(
    ticket: Omit<BackofficeSupportTicket, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    },
  ): Promise<BackofficeSupportTicket> {
    const row = getBackofficeStore().addSupport(ticket);
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return row;

    try {
      const saved = await getBackofficePrisma().backofficeSupportTicketRecord.create({
        data: {
          id: row.id,
          priority: row.priority,
          source: row.source,
          status: row.status,
          title: row.title,
          summary: row.summary,
          userId: row.userId,
          userPhone: row.userPhone,
          enterpriseId: row.enterpriseId,
          linkedErrorEventId: row.linkedErrorEventId,
          linkedJourneyId: row.linkedJourneyId,
          assignee: row.assignee,
          note: row.note,
          suggestion: row.suggestion,
        },
      });
      return mapSupportFromPrisma(saved);
    } catch {
      if (mode === "HYBRID") return row;
      throw new Error("backoffice_support_persist_failed");
    }
  }

  async list(opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<BackofficeSupportTicket>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      return paginate(
        getBackofficeStore().support.filter((t) => !t.status.includes("ARCHIVED")),
        opts.page,
        opts.pageSize,
      );
    }

    try {
      const prisma = getBackofficePrisma();
      const where = { archivedAt: null };
      const page = opts.page ?? 1;
      const pageSize = opts.pageSize ?? 50;
      const [total, rows] = await Promise.all([
        prisma.backofficeSupportTicketRecord.count({ where }),
        prisma.backofficeSupportTicketRecord.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
      ]);
      return {
        items: rows.map(mapSupportFromPrisma),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    } catch {
      if (mode === "HYBRID") return paginate(getBackofficeStore().support, opts.page, opts.pageSize);
      return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    }
  }

  async getById(id: string): Promise<BackofficeSupportTicket | null> {
    const mem = getBackofficeStore().support.find((t) => t.id === id) ?? null;
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return mem;

    try {
      const row = await getBackofficePrisma().backofficeSupportTicketRecord.findUnique({ where: { id } });
      return row ? mapSupportFromPrisma(row) : mem;
    } catch {
      return mem;
    }
  }

  async patch(
    id: string,
    patch: Partial<Pick<BackofficeSupportTicket, "status" | "priority" | "note" | "suggestion" | "assignee">>,
  ): Promise<BackofficeSupportTicket | null> {
    const mem = getBackofficeStore().support.find((t) => t.id === id);
    if (mem) {
      Object.assign(mem, patch);
      mem.updatedAt = new Date().toISOString();
    }

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return mem ?? null;

    try {
      const row = await getBackofficePrisma().backofficeSupportTicketRecord.update({
        where: { id },
        data: {
          status: patch.status,
          priority: patch.priority,
          note: patch.note,
          suggestion: patch.suggestion,
          assignee: patch.assignee,
        },
      });
      return mapSupportFromPrisma(row);
    } catch {
      return mem ?? null;
    }
  }
}

let singleton: BackofficeSupportRepository | null = null;
export function getBackofficeSupportRepository(): BackofficeSupportRepository {
  if (!singleton) singleton = new BackofficeSupportRepository();
  return singleton;
}
