import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTerrainProfileGuard } from "./terrain-profile-guard.js";

describe("terrain-profile-guard", () => {
  it("blocks mismatched active profile header", () => {
    const guard = createTerrainProfileGuard("DETAILLANT");
    const req = { headers: { "x-venext-active-profile": "GROSSISTE_B" } } as import("express").Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import("express").Response;
    const next = vi.fn();
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows matching or missing profile header", () => {
    const guard = createTerrainProfileGuard("GROSSISTE_B");
    const next = vi.fn();
    const res = { status: vi.fn(), json: vi.fn(), locals: {} } as unknown as import("express").Response;
    guard({ headers: { "x-venext-active-profile": "GROSSISTE_B" } } as import("express").Request, res, next);
    expect(next).toHaveBeenCalled();
    next.mockClear();
    guard({ headers: {} } as import("express").Request, res, next);
    expect(next).toHaveBeenCalled();
  });
});
