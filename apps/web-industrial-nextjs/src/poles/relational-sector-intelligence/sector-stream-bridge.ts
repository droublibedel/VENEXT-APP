import type { OperationalSignalItem } from "../types";

function relationshipIdFromItem(it: OperationalSignalItem): string | null {
  const p = it.relationalSectorRealtimePayload as { relationshipId?: string } | undefined;
  if (p && typeof p.relationshipId === "string" && p.relationshipId.length > 0) return p.relationshipId;
  try {
    const j = JSON.parse(it.detail) as { relationshipId?: string | null };
    if (typeof j.relationshipId === "string" && j.relationshipId.length > 0) return j.relationshipId;
  } catch {
    /* ignore */
  }
  return null;
}

/** First matching item (stream is newest-first). */
export function findLatestSectorSignalForRelationship(
  stream: OperationalSignalItem[],
  relationshipId: string,
): { envelope: string; item: OperationalSignalItem } | null {
  for (const it of stream) {
    const env = it.relationalSectorEnvelope;
    if (!env || !env.startsWith("relational.sector.")) continue;
    if (relationshipIdFromItem(it) === relationshipId) return { envelope: env, item: it };
  }
  return null;
}

export function sectorEnvelopeToRefetchScopes(envelope: string): Set<
  "overview" | "market" | "propagation" | "pressure" | "expansion" | "dependency" | "systemic"
> {
  const s = new Set<
    "overview" | "market" | "propagation" | "pressure" | "expansion" | "dependency" | "systemic"
  >();
  switch (envelope) {
    case "relational.sector.snapshot.updated":
      for (const x of ["overview", "market", "propagation", "pressure", "expansion", "dependency", "systemic"] as const) {
        s.add(x);
      }
      break;
    case "relational.sector.score.updated":
      s.add("overview");
      s.add("pressure");
      break;
    case "relational.sector.propagation.updated":
      s.add("propagation");
      s.add("systemic");
      break;
    case "relational.sector.dependency.updated":
      s.add("dependency");
      s.add("overview");
      break;
    case "relational.sector.marketStructure.updated":
      s.add("market");
      s.add("overview");
      break;
    default:
      if (envelope.startsWith("relational.sector.")) {
        s.add("overview");
        s.add("pressure");
      }
      break;
  }
  return s;
}
