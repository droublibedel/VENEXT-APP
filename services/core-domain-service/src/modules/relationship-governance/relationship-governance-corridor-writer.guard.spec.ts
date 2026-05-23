import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const governanceRoot = here;

describe("Instruction 20.4B — single writer for Relationship.corridorState", () => {
  it("centralizes prisma.relationship.update corridorState in policy persistCorridorStateRow", () => {
    const policyPath = join(governanceRoot, "relationship-governance-policy.service.ts");
    const policySrc = readFileSync(policyPath, "utf8");
    expect(policySrc).toContain("persistCorridorStateRow");
    expect(policySrc).toContain("Instruction 20.4B — **only** Prisma path");
    expect(policySrc).toContain("await this.prisma.relationship.update");
  });

  it("generic relationship.repository.update does not mention corridorState", () => {
    const repoPath = join(governanceRoot, "../../graph/relationship/relationship.repository.ts");
    const text = readFileSync(repoPath, "utf8");
    expect(text.includes("corridorState")).toBe(false);
  });

  it("backoffice relationship patch does not touch corridorState", () => {
    const boPath = join(governanceRoot, "../backoffice-graph-supervision/backoffice-graph-supervision.service.ts");
    const text = readFileSync(boPath, "utf8");
    expect(text.includes("corridorState")).toBe(false);
  });
});
