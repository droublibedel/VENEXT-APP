import type { BackofficeEnterpriseProfile } from "../types/platform.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import { paginate, type PaginatedResult } from "../persistence/lightweight-envelope.js";

export type EnterpriseGovernanceEventRow = {
  id: string;
  enterpriseId: string;
  eventKind: string;
  title: string;
  detail: string;
  author?: string;
  previousState?: string;
  newState?: string;
  createdAt: string;
};

function mapChannelStatus(status: string): BackofficeEnterpriseProfile["channelStatus"] {
  if (status === "ACTIVE" || status === "CHANNEL_OPEN") return "open";
  if (status === "SUSPENDED") return "suspended";
  if (status === "ARCHIVED" || status === "CLOSED") return "archived";
  return "pending";
}

export class BackofficeEnterpriseGovernanceRepository {
  async upsertEnterpriseProfile(profile: BackofficeEnterpriseProfile): Promise<void> {
    const store = getBackofficeStore();
    const idx = store.enterprises.findIndex((e) => e.id === profile.id);
    if (idx >= 0) store.enterprises[idx] = profile;
    else store.enterprises.unshift(profile);
  }

  async listEnterprises(): Promise<BackofficeEnterpriseProfile[]> {
    return getBackofficeStore().enterprises;
  }

  async getEnterprise(id: string): Promise<BackofficeEnterpriseProfile | undefined> {
    return getBackofficeStore().enterprises.find((e) => e.id === id);
  }

  async appendGovernanceEvent(
    event: Omit<EnterpriseGovernanceEventRow, "id" | "createdAt">,
  ): Promise<EnterpriseGovernanceEventRow> {
    const row: EnterpriseGovernanceEventRow = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return row;

    try {
      const saved = await getBackofficePrisma().backofficeEnterpriseGovernanceEventRecord.create({
        data: {
          id: row.id,
          enterpriseId: row.enterpriseId,
          eventKind: row.eventKind,
          title: row.title,
          detail: row.detail,
          author: row.author,
          previousState: row.previousState,
          newState: row.newState,
        },
      });
      return {
        id: saved.id,
        enterpriseId: saved.enterpriseId,
        eventKind: saved.eventKind,
        title: saved.title,
        detail: saved.detail,
        author: saved.author ?? undefined,
        previousState: saved.previousState ?? undefined,
        newState: saved.newState ?? undefined,
        createdAt: saved.createdAt.toISOString(),
      };
    } catch {
      if (mode === "HYBRID") return row;
      throw new Error("governance_event_persist_failed");
    }
  }

  async listGovernanceEvents(
    enterpriseId: string,
    opts: { page?: number; pageSize?: number } = {},
  ): Promise<PaginatedResult<EnterpriseGovernanceEventRow>> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };

    try {
      const prisma = getBackofficePrisma();
      const where = { enterpriseId, archivedAt: null };
      const page = opts.page ?? 1;
      const pageSize = opts.pageSize ?? 50;
      const [total, rows] = await Promise.all([
        prisma.backofficeEnterpriseGovernanceEventRecord.count({ where }),
        prisma.backofficeEnterpriseGovernanceEventRecord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
      ]);
      return {
        items: rows.map((r) => ({
          id: r.id,
          enterpriseId: r.enterpriseId,
          eventKind: r.eventKind,
          title: r.title,
          detail: r.detail,
          author: r.author ?? undefined,
          previousState: r.previousState ?? undefined,
          newState: r.newState ?? undefined,
          createdAt: r.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    }
  }

  channelStatusFromGovernance(status: string): BackofficeEnterpriseProfile["channelStatus"] {
    return mapChannelStatus(status);
  }
}

let singleton: BackofficeEnterpriseGovernanceRepository | null = null;
export function getBackofficeEnterpriseGovernanceRepository(): BackofficeEnterpriseGovernanceRepository {
  if (!singleton) singleton = new BackofficeEnterpriseGovernanceRepository();
  return singleton;
}
