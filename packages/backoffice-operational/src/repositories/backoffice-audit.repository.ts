import type { BackofficeInternalAuditEntry } from "../types/audit.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma, toPrismaJson } from "../persistence/prisma.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export class BackofficeAuditRepository {
  async append(input: Omit<BackofficeInternalAuditEntry, "id" | "at">): Promise<BackofficeInternalAuditEntry> {
    const entry = getBackofficeStore().appendAudit(input);
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return entry;

    try {
      await getBackofficePrisma().backofficeAuditLog.create({
        data: {
          actor: input.actorEmail,
          source: "operational",
          action: input.action,
          target: `${input.targetType}:${input.targetId}`,
          metadata: toPrismaJson({
            actorId: input.actorId,
            note: input.note,
            ...(input.metadata ?? {}),
            signedAt: new Date().toISOString(),
          }),
        },
      });
    } catch {
      if (mode !== "HYBRID") {
        /* append-only mémoire déjà écrit */
      }
    }
    return entry;
  }

  async list(opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<BackofficeInternalAuditEntry>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      return paginate(getBackofficeStore().audit, opts.page, opts.pageSize);
    }

    try {
      const prisma = getBackofficePrisma();
      const page = opts.page ?? 1;
      const pageSize = Math.min(200, opts.pageSize ?? 50);
      const where = { source: "operational" };
      const [total, rows] = await Promise.all([
        prisma.backofficeAuditLog.count({ where }),
        prisma.backofficeAuditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
      ]);
      const items: BackofficeInternalAuditEntry[] = rows.map((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>;
        const [targetType, targetId] = String(r.target).split(":");
        return {
          id: r.id,
          at: r.createdAt.toISOString(),
          actorEmail: r.actor,
          actorId: String(meta.actorId ?? r.actor),
          action: r.action,
          targetType: targetType ?? "unknown",
          targetId: targetId ?? r.target,
          note: typeof meta.note === "string" ? meta.note : undefined,
          metadata: meta,
        };
      });
      return { items, total, page, pageSize, hasMore: page * pageSize < total };
    } catch {
      if (mode === "HYBRID") return paginate(getBackofficeStore().audit, opts.page, opts.pageSize);
      return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    }
  }
}

let singleton: BackofficeAuditRepository | null = null;
export function getBackofficeAuditRepository(): BackofficeAuditRepository {
  if (!singleton) singleton = new BackofficeAuditRepository();
  return singleton;
}
