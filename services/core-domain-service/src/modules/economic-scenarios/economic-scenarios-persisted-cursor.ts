import { BadRequestException } from "@nestjs/common";

export type PersistedScenarioCursor = { createdAt: Date; id: string };

export function encodePersistedScenarioCursor(row: { createdAt: Date; id: string }): string {
  const payload = JSON.stringify({ c: row.createdAt.toISOString(), i: row.id });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodePersistedScenarioCursor(cursor: string): PersistedScenarioCursor {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const o = JSON.parse(raw) as { c?: string; i?: string };
    if (!o?.c || !o?.i) throw new Error("invalid_shape");
    const createdAt = new Date(o.c);
    if (Number.isNaN(createdAt.getTime())) throw new Error("bad_date");
    return { createdAt, id: o.i };
  } catch {
    throw new BadRequestException({ code: "economic_scenarios_persisted_invalid_cursor" });
  }
}
