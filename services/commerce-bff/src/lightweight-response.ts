/** Instruction 20.85 — BFF payload trimming (no new architecture). */

export function trimBffArray<T>(items: T[], max = 50): { payload: T[]; trimmed: boolean } {
  if (items.length <= max) return { payload: items, trimmed: false };
  return { payload: items.slice(0, max), trimmed: true };
}

export function shapeBffEnvelope<T>(
  payload: T,
  dataSource: "live" | "fallback" | "mixed",
  opts?: { fallbackUsed?: boolean; maxItems?: number },
) {
  let shaped: T = payload;
  let trimmed = false;
  if (Array.isArray(payload) && opts?.maxItems) {
    const { payload: p, trimmed: t } = trimBffArray(payload, opts.maxItems);
    shaped = p as T;
    trimmed = t;
  }
  return {
    dataSource,
    fallbackUsed: opts?.fallbackUsed ?? dataSource !== "live",
    payload: shaped,
    ...(trimmed ? { trimmed: true, itemCount: Array.isArray(shaped) ? shaped.length : undefined } : {}),
  };
}
