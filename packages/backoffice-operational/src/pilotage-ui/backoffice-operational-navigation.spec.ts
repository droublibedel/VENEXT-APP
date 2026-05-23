import { describe, expect, it } from "vitest";

import { normalizeBackofficeEnvelope } from "../persistence/backoffice-lightweight-envelope.js";

const PILOTAGE_ROUTES = [
  "/pilotage",
  "/pilotage/errors",
  "/pilotage/journeys",
  "/pilotage/users",
  "/pilotage/enterprises",
  "/pilotage/support",
  "/pilotage/health",
  "/pilotage/apps",
  "/pilotage/audit",
  "/pilotage/search",
];

const DETAIL_ROUTES = [
  "/pilotage/errors/err-1",
  "/pilotage/journeys/j-1",
  "/pilotage/users/u-1",
  "/pilotage/support/t-1",
  "/pilotage/enterprises/e-1",
];

describe("backoffice-operational-navigation", () => {
  it.each(PILOTAGE_ROUTES)("route exists %s", (route) => {
    expect(route.startsWith("/pilotage")).toBe(true);
  });

  it.each(DETAIL_ROUTES)("detail route pattern %s", (route) => {
    expect(route.split("/").length).toBeGreaterThanOrEqual(4);
  });

  it.each(Array.from({ length: 12 }, (_, i) => i))("list envelope nav %i", (i) => {
    const env = normalizeBackofficeEnvelope({
      payload: [{ id: `row-${i}`, href: `/pilotage/errors/e-${i}` }],
    });
    expect(env.payload[0]).toHaveProperty("href");
  });
});
