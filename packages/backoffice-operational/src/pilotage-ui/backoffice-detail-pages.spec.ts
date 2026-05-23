import { beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore } from "../store/backoffice-store.js";
import { seedOperationalDemoData } from "../seed/demo-operational-seed.js";
import { getBackofficeErrorRepository } from "../repositories/backoffice-error.repository.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import { getBackofficeSupportRepository } from "../repositories/backoffice-support.repository.js";
import { getUserOperationalProfile, getEnterpriseOperationalProfile } from "../services/operational-readouts.js";

beforeEach(async () => {
  resetBackofficeStore();
  await seedOperationalDemoData();
});

describe("backoffice-detail-pages", () => {
  it("loads error by id", async () => {
    const list = await getBackofficeErrorRepository().list({ pageSize: 1 });
    const id = list.items[0]?.id;
    expect(id).toBeTruthy();
    const row = await getBackofficeErrorRepository().getById(id!);
    expect(row?.id).toBe(id);
  });

  it("loads journey by id", async () => {
    const list = await getBackofficeJourneyRepository().list({ pageSize: 1 });
    const id = list.items[0]?.journeyId;
    const row = await getBackofficeJourneyRepository().getById(id!);
    expect(row?.journeyId).toBe(id);
  });

  it("loads support by id", async () => {
    const list = await getBackofficeSupportRepository().list({ pageSize: 1 });
    const id = list.items[0]?.id;
    const row = await getBackofficeSupportRepository().getById(id!);
    expect(row?.id).toBe(id);
  });

  it("user operational profile", async () => {
    const users = (await import("../store/backoffice-store.js")).getBackofficeStore().users;
    const profile = await getUserOperationalProfile(users[0]!.id);
    expect(profile?.user).toBeTruthy();
    expect(Array.isArray(profile?.errors)).toBe(true);
  });

  it("enterprise profile 404", async () => {
    const profile = await getEnterpriseOperationalProfile("missing-enterprise-id");
    expect(profile).toBeNull();
  });

  it.each(["status", "priority", "note"])("support patch field %s", async (field) => {
    const list = await getBackofficeSupportRepository().list({ pageSize: 1 });
    const id = list.items[0]!.id;
    const patch =
      field === "status"
        ? { status: "IN_PROGRESS" as const }
        : field === "priority"
          ? { priority: "HIGH" as const }
          : { note: "test note" };
    const row = await getBackofficeSupportRepository().patch(id, patch);
    expect(row).toBeTruthy();
  });
});
