import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { MESSAGING_SUSPENDED_UX } from "commerce-access-control";

import { evaluateBffAccess } from "./commerce-access-request.js";

function mockReq(query: Record<string, string>, headers: Record<string, string> = {}): Request {
  return {
    query,
    headers,
  } as unknown as Request;
}

describe("evaluateBffAccess participant suspended 20.86-E1", () => {
  it("blocks messaging via query participantStatus", () => {
    const result = evaluateBffAccess(
      mockReq({
        organizationId: "org-b",
        relationshipId: "rel-1",
        relationshipStatus: "ACTIVE",
        participantStatus: "SUSPENDED",
      }),
      "messaging",
    );
    expect(result.allowed).toBe(false);
    expect(result.userMessage).toBe(MESSAGING_SUSPENDED_UX);
  });

  it("blocks messaging via header x-participant-status", () => {
    const result = evaluateBffAccess(
      mockReq(
        { organizationId: "org-b", relationshipId: "rel-1" },
        { "x-participant-status": "SUSPENDED" },
      ),
      "messaging",
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks mail when backend guard disabled", () => {
    const prev = process.env.COMMERCE_BACKEND_ACCESS_GUARD;
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "false";
    const result = evaluateBffAccess(
      mockReq({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      }),
      "mail",
    );
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = prev;
    expect(result.allowed).toBe(false);
  });
});
