import { beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore } from "../store/backoffice-store.js";
import { seedOperationalDemoData } from "../seed/demo-operational-seed.js";
import { globalSearch } from "../services/operational-readouts.js";

beforeEach(async () => {
  resetBackofficeStore();
  await seedOperationalDemoData();
});

describe("backoffice-search-navigation", () => {
  it("returns user href with detail path", async () => {
    const r = await globalSearch("Khadija");
    const user = r.find((x) => x.kind === "user");
    expect(user?.href).toMatch(/^\/pilotage\/users\//);
  });

  it("returns enterprise href", async () => {
    const r = await globalSearch("Agro");
    expect(r.some((x) => x.kind === "enterprise" && x.href.includes("/pilotage/enterprises/"))).toBe(true);
  });

  it("returns error href", async () => {
    const r = await globalSearch("otp");
    const err = r.find((x) => x.kind === "error");
    if (err) expect(err.href).toMatch(/^\/pilotage\/errors\//);
  });

  it("returns journey href", async () => {
    const r = await globalSearch("login");
    const j = r.find((x) => x.kind === "journey");
    if (j) expect(j.href).toMatch(/^\/pilotage\/journeys\//);
  });

  it("returns support href with id", async () => {
    const r = await globalSearch("support");
    const s = r.find((x) => x.kind === "support");
    if (s) expect(s.href).toMatch(/^\/pilotage\/support\//);
  });

  it("empty query returns empty", async () => {
    expect(await globalSearch("")).toEqual([]);
  });

  it.each(["a", "e", "o", "in", "com"])("search partial %s", async (q) => {
    const r = await globalSearch(q);
    expect(Array.isArray(r)).toBe(true);
  });
});
