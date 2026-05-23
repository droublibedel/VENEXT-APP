import { describe, expect, it, vi } from "vitest";

import { RelationshipGovernancePolicyService } from "./relationship-governance-policy.service";

describe("Instruction 20.14 — operational_observation governance", () => {
  it("allows observation on BLOCKED corridor without throwing", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          corridorState: "BLOCKED",
          status: "ACCEPTED",
          id: "rel-1",
        }),
      },
    };
    const svc = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(svc.assertCorridorOperational("rel-1", "operational_observation")).resolves.toBeUndefined();
  });
});
