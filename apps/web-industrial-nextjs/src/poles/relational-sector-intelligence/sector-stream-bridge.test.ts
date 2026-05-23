import { describe, expect, it } from "vitest";

import { findLatestSectorSignalForRelationship, sectorEnvelopeToRefetchScopes } from "./sector-stream-bridge";
import type { OperationalSignalItem } from "../types";

describe("Instruction 20.24 — sector stream bridge", () => {
  it("finds latest sector envelope for a relationship", () => {
    const stream: OperationalSignalItem[] = [
      {
        id: "1",
        priority: "MEDIUM",
        label: "x",
        detail: JSON.stringify({ source: "S", relationshipId: "rid-1" }),
        ts: "t",
        relationalSectorEnvelope: "relational.sector.score.updated",
      },
      {
        id: "2",
        priority: "MEDIUM",
        label: "y",
        detail: "{}",
        ts: "t2",
        relationalOrdersEnvelope: "relational.fulfillment.x",
      },
    ];
    const hit = findLatestSectorSignalForRelationship(stream, "rid-1");
    expect(hit?.envelope).toBe("relational.sector.score.updated");
  });

  it("maps snapshot envelope to full refetch scopes", () => {
    const s = sectorEnvelopeToRefetchScopes("relational.sector.snapshot.updated");
    expect(s.has("overview")).toBe(true);
    expect(s.has("systemic")).toBe(true);
  });
});
