import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export type InternalNotification = {
  id: string;
  at: string;
  priority: string;
  title: string;
  body?: string;
  read: boolean;
  linkedType?: string;
  linkedId?: string;
};

export class BackofficeInternalNotificationRepository {
  async push(input: Omit<InternalNotification, "id" | "at" | "read">): Promise<InternalNotification> {
    const store = getBackofficeStore();
    const row: InternalNotification = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      read: false,
      ...input,
    };
    store.notifications.unshift({
      id: row.id,
      at: row.at,
      priority: row.priority,
      title: row.title,
      read: row.read,
    });

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return row;

    try {
      await getBackofficePrisma().backofficeInternalNotificationRecord.create({
        data: {
          id: row.id,
          priority: row.priority,
          title: row.title,
          body: row.body,
          read: false,
          linkedType: row.linkedType,
          linkedId: row.linkedId,
        },
      });
    } catch {
      /* HYBRID */
    }
    return row;
  }

  async list(opts: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}): Promise<PaginatedResult<InternalNotification>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      let rows = getBackofficeStore().notifications.map((n) => ({
        id: n.id,
        at: n.at,
        priority: n.priority,
        title: n.title,
        read: n.read,
      }));
      if (opts.unreadOnly) rows = rows.filter((n) => !n.read);
      return paginate(rows, opts.page, opts.pageSize);
    }

    try {
      const prisma = getBackofficePrisma();
      const where = {
        archivedAt: null,
        ...(opts.unreadOnly ? { read: false } : {}),
      };
      const page = opts.page ?? 1;
      const pageSize = opts.pageSize ?? 40;
      const [total, rows] = await Promise.all([
        prisma.backofficeInternalNotificationRecord.count({ where }),
        prisma.backofficeInternalNotificationRecord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
      ]);
      return {
        items: rows.map((r) => ({
          id: r.id,
          at: r.createdAt.toISOString(),
          priority: r.priority,
          title: r.title,
          body: r.body ?? undefined,
          read: r.read,
          linkedType: r.linkedType ?? undefined,
          linkedId: r.linkedId ?? undefined,
        })),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    } catch {
      if (mode === "HYBRID") {
        const rows = getBackofficeStore().notifications.map((n) => ({
          id: n.id,
          at: n.at,
          priority: n.priority,
          title: n.title,
          read: n.read,
        }));
        return paginate(rows, opts.page, opts.pageSize);
      }
      return { items: [], total: 0, page: 1, pageSize: 40, hasMore: false };
    }
  }
}

let singleton: BackofficeInternalNotificationRepository | null = null;
export function getBackofficeInternalNotificationRepository(): BackofficeInternalNotificationRepository {
  if (!singleton) singleton = new BackofficeInternalNotificationRepository();
  return singleton;
}
