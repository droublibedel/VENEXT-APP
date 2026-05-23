import { resolveBackofficePersistenceMode } from "./persistence-mode.js";
import { getBackofficePrisma, toPrismaJson } from "./prisma.js";

const memoryRetries: { id: string; kind: string; payload: Record<string, unknown>; attempts: number; nextRetryAt: string }[] =
  [];

export async function enqueueOperationalRetry(
  kind: string,
  payload: Record<string, unknown>,
  delayMs = 30_000,
): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    kind,
    payload,
    attempts: 0,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
  };
  memoryRetries.unshift(row);
  if (memoryRetries.length > 200) memoryRetries.length = 200;

  const mode = resolveBackofficePersistenceMode();
  if (mode === "FALLBACK") return;

  try {
    await getBackofficePrisma().backofficeLiveEventRetryRecord.create({
      data: {
        id: row.id,
        kind,
        payload: toPrismaJson(payload),
        attempts: 0,
        nextRetryAt: new Date(row.nextRetryAt),
      },
    });
  } catch {
    /* HYBRID garde mémoire */
  }
}

export async function listDueOperationalRetries(limit = 25): Promise<
  { id: string; kind: string; payload: Record<string, unknown>; attempts: number }[]
> {
  const mode = resolveBackofficePersistenceMode();
  const now = new Date();

  if (mode === "FALLBACK") {
    return memoryRetries
      .filter((r) => new Date(r.nextRetryAt).getTime() <= now.getTime() && r.attempts < 8)
      .slice(0, limit)
      .map((r) => ({ id: r.id, kind: r.kind, payload: r.payload, attempts: r.attempts }));
  }

  try {
    const rows = await getBackofficePrisma().backofficeLiveEventRetryRecord.findMany({
      where: { nextRetryAt: { lte: now }, attempts: { lt: 8 } },
      orderBy: { nextRetryAt: "asc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      payload: (r.payload as Record<string, unknown>) ?? {},
      attempts: r.attempts,
    }));
  } catch {
    return memoryRetries
      .filter((r) => new Date(r.nextRetryAt).getTime() <= now.getTime())
      .slice(0, limit)
      .map((r) => ({ id: r.id, kind: r.kind, payload: r.payload, attempts: r.attempts }));
  }
}

export async function bumpOperationalRetry(id: string, success: boolean): Promise<void> {
  const mem = memoryRetries.find((r) => r.id === id);
  if (mem) {
    if (success) {
      const idx = memoryRetries.indexOf(mem);
      if (idx >= 0) memoryRetries.splice(idx, 1);
    } else {
      mem.attempts += 1;
      mem.nextRetryAt = new Date(Date.now() + 60_000 * mem.attempts).toISOString();
    }
  }

  const mode = resolveBackofficePersistenceMode();
  if (mode === "FALLBACK") return;

  try {
    if (success) {
      await getBackofficePrisma().backofficeLiveEventRetryRecord.delete({ where: { id } });
      return;
    }
    const row = await getBackofficePrisma().backofficeLiveEventRetryRecord.findUnique({ where: { id } });
    if (!row) return;
    await getBackofficePrisma().backofficeLiveEventRetryRecord.update({
      where: { id },
      data: {
        attempts: row.attempts + 1,
        nextRetryAt: new Date(Date.now() + 60_000 * (row.attempts + 1)),
      },
    });
  } catch {
    /* ignore */
  }
}

export function resetOperationalRetryQueueForTests(): void {
  memoryRetries.length = 0;
}
