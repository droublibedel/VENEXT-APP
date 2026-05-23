import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BackofficeAuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: {
    actor: string;
    action: string;
    target: string;
    source?: string;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.backofficeAuditLog.create({
      data: {
        actor: input.actor,
        action: input.action,
        target: input.target,
        source: input.source ?? "governance",
        before: input.before === undefined ? undefined : (input.before as Prisma.InputJsonValue),
        after: input.after === undefined ? undefined : (input.after as Prisma.InputJsonValue),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async list(opts: { limit?: number; action?: string; cursor?: string }) {
    const take = Math.min(Math.max(opts.limit ?? 40, 1), 100);
    const base = {
      where: opts.action ? { action: opts.action } : {},
      orderBy: { createdAt: "desc" as const },
      take: take + 1,
    };
    const rows = opts.cursor
      ? await this.prisma.backofficeAuditLog.findMany({
          ...base,
          skip: 1,
          cursor: { id: opts.cursor },
        })
      : await this.prisma.backofficeAuditLog.findMany(base);
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;
    return {
      logs: pageRows,
      page: { take, nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null, hasMore },
    };
  }
}
