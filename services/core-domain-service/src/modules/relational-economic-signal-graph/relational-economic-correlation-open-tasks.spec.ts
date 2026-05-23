import { describe, expect, it, vi } from "vitest";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicCorrelationService } from "./relational-economic-correlation.service";
import { RelationalEconomicSignalPolicyService } from "./relational-economic-signal-policy.service";
import {
  ECONOMIC_GRAPH_EXCLUDED_TASK_STATUSES,
  ECONOMIC_GRAPH_OPEN_TASK_STATUSES,
  ECONOMIC_GRAPH_OPEN_TASKS_SOURCE,
} from "./relational-economic-signal-graph.constants";

describe("Instruction 20.19A — openTasks stress snapshot", () => {
  const policy = new RelationalEconomicSignalPolicyService();

  function makeService(taskCount: number) {
    const prisma = {
      order: { findMany: vi.fn().mockResolvedValue([]) },
      relationalFulfillmentIncident: { count: vi.fn() },
      relationalOperationalAlert: { count: vi.fn().mockResolvedValue(0) },
      relationalOperationalSimulation: { count: vi.fn().mockResolvedValue(0) },
      relationalOperationalOrchestration: { count: vi.fn().mockResolvedValue(0) },
      relationalOperationalRecommendation: { count: vi.fn().mockResolvedValue(0) },
      relationalStrategicMemory: { count: vi.fn().mockResolvedValue(0) },
      relationalFulfillmentTask: {
        count: vi.fn().mockResolvedValue(taskCount),
      },
    } as unknown as PrismaService;
    return new RelationalEconomicCorrelationService(prisma, policy);
  }

  it("returns openTasks = 0 when no open tasks", async () => {
    const svc = makeService(0);
    const snap = await svc.gatherStressSnapshot("00000000-0000-4000-8000-000000000001");
    expect(snap.openTasks).toBe(0);
    expect(snap.openTasksComputed).toBe(true);
    expect(snap.openTasksSource).toBe(ECONOMIC_GRAPH_OPEN_TASKS_SOURCE);
  });

  it("counts OPEN and BLOCKED via included statuses filter", async () => {
    const svc = makeService(3);
    await svc.gatherStressSnapshot("00000000-0000-4000-8000-000000000001");
    const prisma = (svc as unknown as { prisma: { relationalFulfillmentTask: { count: ReturnType<typeof vi.fn> } } })
      .prisma;
    expect(prisma.relationalFulfillmentTask.count).toHaveBeenCalledWith({
      where: {
        relationshipId: "00000000-0000-4000-8000-000000000001",
        taskStatus: { in: ECONOMIC_GRAPH_OPEN_TASK_STATUSES },
      },
    });
    const snap = await svc.gatherStressSnapshot("00000000-0000-4000-8000-000000000001");
    expect(snap.openTasks).toBe(3);
    expect(snap.openTasksIncludedStatuses).toEqual(ECONOMIC_GRAPH_OPEN_TASK_STATUSES);
    expect(snap.openTasksExcludedStatuses).toEqual(ECONOMIC_GRAPH_EXCLUDED_TASK_STATUSES);
  });
});
