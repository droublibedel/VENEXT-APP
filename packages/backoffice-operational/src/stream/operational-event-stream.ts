import type { BackofficeStreamEventKind } from "@prisma/client";

import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma, toPrismaJson } from "../persistence/prisma.js";

export type OperationalStreamEvent = {
  id: string;
  kind: BackofficeStreamEventKind | string;
  title: string;
  payload: Record<string, unknown>;
  application?: string;
  enterpriseId?: string;
  userId?: string;
  createdAt: string;
};

const memoryBuffer: OperationalStreamEvent[] = [];
const MAX_BUFFER = 500;

export class BackofficeOperationalEventStream {
  private static instance: BackofficeOperationalEventStream | null = null;

  static shared(): BackofficeOperationalEventStream {
    if (!this.instance) this.instance = new BackofficeOperationalEventStream();
    return this.instance;
  }

  static reset(): void {
    memoryBuffer.length = 0;
    this.instance = null;
  }

  async append(input: Omit<OperationalStreamEvent, "id" | "createdAt">): Promise<OperationalStreamEvent> {
    const event: OperationalStreamEvent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    memoryBuffer.unshift(event);
    if (memoryBuffer.length > MAX_BUFFER) memoryBuffer.length = MAX_BUFFER;

    const mode = resolveBackofficePersistenceMode();
    if (mode !== "FALLBACK") {
      try {
        await getBackofficePrisma().backofficeOperationalStreamEventRecord.create({
          data: {
            id: event.id,
            kind: event.kind as BackofficeStreamEventKind,
            title: event.title,
            payload: toPrismaJson(event.payload),
            application: event.application,
            enterpriseId: event.enterpriseId,
            userId: event.userId,
          },
        });
      } catch {
        /* HYBRID keeps memory */
      }
    }
    return event;
  }

  async list(opts: {
    kind?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<OperationalStreamEvent[]> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      let rows = [...memoryBuffer];
      if (opts.kind) rows = rows.filter((e) => e.kind === opts.kind);
      const page = opts.page ?? 1;
      const size = opts.pageSize ?? 50;
      return rows.slice((page - 1) * size, page * size);
    }

    try {
      const rows = await getBackofficePrisma().backofficeOperationalStreamEventRecord.findMany({
        where: {
          archivedAt: null,
          ...(opts.kind ? { kind: opts.kind as BackofficeStreamEventKind } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: opts.pageSize ?? 50,
        skip: ((opts.page ?? 1) - 1) * (opts.pageSize ?? 50),
      });
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        payload: r.payload as Record<string, unknown>,
        application: r.application ?? undefined,
        enterpriseId: r.enterpriseId ?? undefined,
        userId: r.userId ?? undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return memoryBuffer.slice(0, opts.pageSize ?? 50);
    }
  }
}
