import { describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";

import { CommerceThreadActorResolver } from "./commerce-thread-actor-resolver.service";

describe("CommerceThreadActorResolver", () => {
  it("prefers AUTH_CONTEXT when Venext headers are present", () => {
    const r = new CommerceThreadActorResolver();
    const out = r.resolveFromRequest({
      headers: {
        "x-venext-user-id": "21111111-1111-4111-8111-111111111103",
        "x-venext-acting-organization-id": "31111111-1111-4111-8111-111111111103",
      },
      query: {},
      params: {},
    });
    expect(out.actorResolvedFrom).toBe("AUTH_CONTEXT");
    expect(out.userId).toBe("21111111-1111-4111-8111-111111111103");
  });

  it("throws when headers missing and no dev fallback", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    const r = new CommerceThreadActorResolver();
    expect(() =>
      r.resolveFromRequest({
        headers: {},
        query: {},
        params: {},
      }),
    ).toThrow(ForbiddenException);
    vi.unstubAllEnvs();
  });
});
