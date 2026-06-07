import type { NextFunction, Request, Response } from "express";

export type TerrainProfileApiId = "GROSSISTE_B" | "DETAILLANT";

const HEADER_ACTIVE = "x-venext-active-profile";

function normalizeProfileHeader(value: string | string[] | undefined): TerrainProfileApiId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const normalized = raw.trim().toUpperCase().replace("-", "_");
  if (normalized === "GROSSISTE_B") return "GROSSISTE_B";
  if (normalized === "DETAILLANT") return "DETAILLANT";
  return null;
}

export function createTerrainProfileGuard(expected: TerrainProfileApiId) {
  return (req: Request, res: Response, next: NextFunction) => {
    const active = normalizeProfileHeader(req.headers[HEADER_ACTIVE]);
    if (active && active !== expected) {
      res.status(403).json({
        ok: false,
        code: "profile_context_mismatch",
        expectedProfile: expected,
        activeProfile: active,
      });
      return;
    }
    if (active) {
      res.locals.terrainActiveProfile = active;
      res.locals.terrainRuntimeContext = req.headers["x-venext-runtime-context"] ?? "terrain_mobile";
      res.locals.terrainProfileSessionId = req.headers["x-venext-profile-session-id"] ?? null;
    }
    next();
  };
}

export function readTerrainProfileHeaders(req: Request): {
  activeProfile: TerrainProfileApiId | null;
  runtimeContext: string | null;
  profileSessionId: string | null;
} {
  return {
    activeProfile: normalizeProfileHeader(req.headers[HEADER_ACTIVE]),
    runtimeContext: String(req.headers["x-venext-runtime-context"] ?? "") || null,
    profileSessionId: String(req.headers["x-venext-profile-session-id"] ?? "") || null,
  };
}
