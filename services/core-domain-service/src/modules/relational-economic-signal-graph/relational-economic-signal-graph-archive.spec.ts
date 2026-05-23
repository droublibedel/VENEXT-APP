import { describe, expect, it, vi } from "vitest";

import { RelationalEconomicSignalGraphService } from "./relational-economic-signal-graph.service";

describe("Instruction 20.19A — archiveSignal realtime semantics", () => {
  it("publishes signal_archived and not signal_created", async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      relationalEconomicSignalNode: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000001",
          relationshipId: "00000000-0000-4000-8000-000000000002",
          nodeCode: "CORRIDOR:00000000-0000-4000-8000-000000000002",
          nodeType: "CORRIDOR",
          severity: "LOW",
          propagationRisk: "LOW",
          dependencyScore: 10,
          corridorInfluenceScore: 10,
          operationalFragilityScore: 10,
          systemicExposureScore: 10,
          observedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      relationalEconomicSignalEvent: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
      relationship: { findUnique: vi.fn() },
      order: { findFirst: vi.fn() },
    };
    const corridorPolicy = {
      assertCorridorOperational: vi.fn().mockResolvedValue(undefined),
    };
    const graph = new RelationalEconomicSignalGraphService(
      prisma as never,
      { canMutateGraph: () => true } as never,
      corridorPolicy as never,
      {} as never,
      {} as never,
      {} as never,
      { publishBothSides: publish } as never,
    );
    (graph as unknown as { assertObservationAllowed: () => Promise<unknown> }).assertObservationAllowed =
      vi.fn().mockResolvedValue({
        buyerOrganizationId: "00000000-0000-4000-8000-000000000010",
        sellerOrganizationId: "00000000-0000-4000-8000-000000000011",
        corridorState: "ACTIVE",
      });

    await graph.archiveSignal({
      nodeId: "00000000-0000-4000-8000-000000000001",
      body: { archiveReason: "test archive" },
      actorOrganizationId: "00000000-0000-4000-8000-000000000010",
      actorUserId: "00000000-0000-4000-8000-000000000099",
    });

    expect(publish).toHaveBeenCalled();
    const realtimeEventType = publish.mock.calls[0]![0].realtimeEventType;
    expect(realtimeEventType).toBe("relational.economic.signal_archived");
    expect(realtimeEventType).not.toBe("relational.economic.signal_created");
    expect(publish.mock.calls[0]![0].journalEventType).toBe("SIGNAL_ARCHIVED");
  });
});
