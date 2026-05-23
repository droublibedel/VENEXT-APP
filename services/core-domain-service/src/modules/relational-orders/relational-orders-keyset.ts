/** Instruction 20.0 — keyset cursor: createdAt desc, orderId desc → cursor `createdAtISO__orderId`. */
export const RELATIONAL_ORDER_CURSOR_SEP = "__" as const;

export function encodeRelationalOrderCursor(createdAt: Date, orderId: string): string {
  return `${createdAt.toISOString()}${RELATIONAL_ORDER_CURSOR_SEP}${orderId}`;
}

export function parseRelationalOrderCursor(raw?: string): { at: Date; id: string } | null {
  if (!raw?.includes(RELATIONAL_ORDER_CURSOR_SEP)) return null;
  const i = raw.lastIndexOf(RELATIONAL_ORDER_CURSOR_SEP);
  const ts = raw.slice(0, i);
  const id = raw.slice(i + RELATIONAL_ORDER_CURSOR_SEP.length);
  const at = new Date(ts);
  if (Number.isNaN(at.getTime()) || id.length < 32) return null;
  return { at, id };
}
