import { describe, expect, it, vi, afterEach } from "vitest";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";

import { CommercialTrustProfileAccessGuard } from "./commercial-trust-profile-access.guard";

function makeCtx(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, query: {} as Record<string, unknown> }),
    }),
  } as ExecutionContext;
}

describe("Instruction 20.3A — CommercialTrustProfileAccessGuard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects anonymous actors when dev bypass is off", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    const g = new CommercialTrustProfileAccessGuard();
    expect(() => g.canActivate(makeCtx({}))).toThrow(ForbiddenException);
  });

  it("allows backoffice commercial trust full without acting org", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    const g = new CommercialTrustProfileAccessGuard();
    expect(g.canActivate(makeCtx({ "x-venext-user-role": "BACKOFFICE_ADMIN" }))).toBe(true);
  });

  it("allows resolved acting organization", () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    const g = new CommercialTrustProfileAccessGuard();
    expect(
      g.canActivate(
        makeCtx({
          "x-venext-acting-organization-id": "00000000-0000-4000-8000-000000000099",
        }),
      ),
    ).toBe(true);
  });
});
