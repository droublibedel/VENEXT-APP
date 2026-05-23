import { describe, expect, it } from "vitest";

import {
  applyScreenIntent,
  buildScreenNavigationPayload,
  destinationUsesMessagingNotMail,
  resolveActorScreenDestination,
} from "./index";
import type { CommercialScreenIntent } from "./commercial-screen-intent";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
  commercial_relationship_governance_enabled: true,
};

const INTENTS: CommercialScreenIntent[] = [
  "view-order",
  "view-delivery",
  "view-settlement",
  "view-conversation",
  "view-mail-thread",
  "view-activity",
  "view-catalog",
];

describe("commercial cross-screen navigation — destinations (20.76-A)", () => {
  it.each(INTENTS)("grossiste B resolves %s", (intent) => {
    const dest = resolveActorScreenDestination("grossiste_b", intent);
    expect(dest?.actor).toBe("grossiste_b");
    expect(dest?.screen).toBeTruthy();
  });

  it.each(INTENTS)("grossiste A resolves %s", (intent) => {
    const dest = resolveActorScreenDestination("grossiste_a", intent);
    expect(dest?.actor).toBe("grossiste_a");
    expect(dest?.screen).toBeTruthy();
  });

  it.each(INTENTS)("detaillant resolves %s", (intent) => {
    const dest = resolveActorScreenDestination("detaillant", intent);
    expect(dest?.actor).toBe("detaillant");
    expect(dest?.screen).toBeTruthy();
  });

  it.each(INTENTS)("producteur resolves %s", (intent) => {
    const dest = resolveActorScreenDestination("producteur", intent);
    expect(dest?.actor).toBe("producteur");
    expect(dest?.screen).toBeTruthy();
  });

  it("order intent maps grossiste B to orders tab", () => {
    expect(resolveActorScreenDestination("grossiste_b", "view-order")?.screen).toBe("orders");
  });

  it("delivery intent maps grossiste A to distribution", () => {
    expect(resolveActorScreenDestination("grossiste_a", "view-delivery")?.screen).toBe("distribution");
  });

  it("settlement intent maps detaillant to account", () => {
    expect(resolveActorScreenDestination("detaillant", "view-settlement")?.screen).toBe("account");
  });

  it("producer order intent includes orders sub-tab", () => {
    const dest = resolveActorScreenDestination("producteur", "view-order");
    expect(dest?.screen).toBe("relational-commercial");
    expect(dest?.subTab).toBe("orders");
  });

  it("terrain mail uses messaging not mail surface", () => {
    expect(destinationUsesMessagingNotMail("grossiste_b", "view-mail-thread")).toBe(true);
    expect(destinationUsesMessagingNotMail("detaillant", "view-mail-thread")).toBe(true);
    expect(destinationUsesMessagingNotMail("grossiste_a", "view-mail-thread")).toBe(false);
  });

  it("buildScreenNavigationPayload returns inline commerce label", () => {
    const payload = buildScreenNavigationPayload(
      "grossiste_b",
      { target: "order", reference: { orderId: "o-1" }, label: "Commande", inline: true },
      FLAGS_ON,
    );
    expect(payload?.destination.screen).toBe("orders");
    expect(payload?.label).not.toMatch(/erp|wizard|cockpit/i);
  });

  it("governance blocks producteur conversation when formal mail preferred", () => {
    const payload = applyScreenIntent(
      "producteur",
      "view-conversation",
      { partnerId: "grossiste_a-producteur", conversationId: "c-1" },
      FLAGS_ON,
    );
    expect(payload).toBeNull();
  });

  it("governance allows producteur mail thread", () => {
    const payload = applyScreenIntent(
      "producteur",
      "view-mail-thread",
      { partnerId: "grossiste_a-producteur", mailThreadId: "m-1" },
      FLAGS_ON,
    );
    expect(payload?.destination.screen).toBe("producer-commercial-mail-workspace");
  });

  it("anti-tunnel — navigation payload stays commerce-first", () => {
    const payload = buildScreenNavigationPayload(
      "grossiste_a",
      { target: "wallet", reference: { settlementId: "s-1" }, label: "Règlement", inline: true },
      { ...FLAGS_ON, commercial_relationship_governance_enabled: false },
    );
    expect(payload?.screenIntent).toBe("view-settlement");
    expect(payload?.destination.screen).toBe("commerce-wallet");
  });
});
