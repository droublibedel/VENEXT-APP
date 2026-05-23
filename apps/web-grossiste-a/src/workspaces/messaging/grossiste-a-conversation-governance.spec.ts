/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";

import { mockGrossisteACatalog, mockGrossisteANetwork, mockGrossisteAOrders } from "../../mocks/grossiste-a-mock-data";
import { buildGrossisteAGovernanceBundle, grossisteAOrderGovernance } from "./grossiste-a-conversation-governance";
import { buildGrossisteAMessagingInjected } from "./grossiste-a-messaging-adapter";
import { grossisteAProductConversationSettings } from "./grossiste-a-product-conversation-settings";

describe("grossiste A conversation governance", () => {
  it("builds account settings with authorized partners", () => {
    const bundle = buildGrossisteAGovernanceBundle({
      network: mockGrossisteANetwork(),
      catalogProducts: mockGrossisteACatalog().products,
      governanceEnabled: true,
    });
    expect(bundle.account.authorizedPartnerIds).toContain("pt1");
  });

  it("marks delivery orders as delivery-only scope", () => {
    const orders = mockGrossisteAOrders();
    const livraison = orders.recent.find((o) => o.status === "livraison")!;
    expect(grossisteAOrderGovernance(livraison).scope).toBe("delivery-only");
  });

  it("injects governance resolvers into messaging payload", () => {
    const injected = buildGrossisteAMessagingInjected({
      overview: null,
      network: mockGrossisteANetwork(),
      orders: mockGrossisteAOrders(),
      intelligence: null,
      catalogProducts: mockGrossisteACatalog().products,
      governanceEnabled: true,
      dataSource: "fallback",
      fallbackUsed: true,
      loading: false,
      onRefresh: () => {},
    });
    expect(injected.governanceEnabled).toBe(true);
    expect(injected.resolveConversationGovernance).toBeDefined();
    const id = injected.conversations[0]!.id;
    const g = injected.resolveConversationGovernance!(id);
    expect(g.badgeLabel.length).toBeGreaterThan(0);
  });

  it("assigns partner-only mode for nord/abidjan coverage products", () => {
    const product = mockGrossisteACatalog().products.find((p) => p.networkCoverage === "Nord")!;
    expect(grossisteAProductConversationSettings(product).conversationMode).toBe("PARTNER_ONLY");
  });
});
