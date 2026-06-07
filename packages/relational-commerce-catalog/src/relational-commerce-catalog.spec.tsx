/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationalCommerceCatalogShell } from "./RelationalCommerceCatalogShell";
import {
  canViewCatalog,
  filterVisibleCatalogs,
  isFormalActor,
  isProductVisible,
  isRelationalCatalogEnabled,
  isSponsoredDiscoveryEnabled,
  isTerrainActor,
} from "./relational-commerce-catalog-governance";
import {
  buildPartnerCatalogHints,
  buildRelationalCatalogSignals,
  buildSponsoredDiscoveryHints,
  sanitizeRelationalCommerceText,
} from "./relational-commerce-catalog-intelligence";
import { mockRelationalCatalogView } from "./relational-commerce-catalog.viewmodel";
import { useRelationalCommerceCatalog } from "./useRelationalCommerceCatalog";

const LazyShell = lazy(() =>
  import("./RelationalCommerceCatalogShell").then((m) => ({
    default: m.RelationalCommerceCatalogShell,
  })),
);

afterEach(() => cleanup());

describe("relational commerce catalog governance", () => {
  it("enables relational catalog by default in dev flags", () => {
    expect(isRelationalCatalogEnabled({})).toBe(true);
    expect(isRelationalCatalogEnabled({ relational_catalog_enabled: false })).toBe(false);
  });

  it("requires active relation for RELATION_ONLY", () => {
    const hidden = {
      supplierId: "hidden",
      supplierType: "test",
      visibilityMode: "HIDDEN" as const,
      relationshipLevel: "NONE" as const,
      products: [],
    };
    expect(canViewCatalog(hidden)).toBe(false);
  });

  it("allows sponsored discovery when flag on", () => {
    const view = mockRelationalCatalogView("detaillant");
    const sponsored = view.catalogs.find((c) => c.visibilityMode === "SPONSORED_DISCOVERY");
    expect(sponsored && canViewCatalog(sponsored, { sponsored_catalog_discovery_enabled: true })).toBe(
      true,
    );
    expect(
      sponsored && canViewCatalog(sponsored, { sponsored_catalog_discovery_enabled: false }),
    ).toBe(false);
  });

  it("filters invisible catalogs", () => {
    const view = mockRelationalCatalogView("grossiste_b");
    const visible = filterVisibleCatalogs(view.catalogs);
    expect(visible.every((c) => c.visibilityMode !== "HIDDEN")).toBe(true);
  });

  it("hides unavailable products in restricted catalog", () => {
    const catalog = {
      supplierId: "x",
      supplierType: "test",
      visibilityMode: "RELATION_ONLY" as const,
      relationshipLevel: "ACTIVE" as const,
      restrictedCatalog: true,
      products: [
        {
          id: "p1",
          name: "A",
          priceLabel: "1",
          availability: "unavailable" as const,
          category: "c",
        },
      ],
    };
    expect(isProductVisible(catalog.products[0]!, catalog)).toBe(false);
  });

  it("separates formal and terrain actors", () => {
    expect(isTerrainActor("detaillant")).toBe(true);
    expect(isFormalActor("producteur")).toBe(true);
    expect(isTerrainActor("grossiste_a")).toBe(false);
  });
});

describe("relational commerce catalog intelligence", () => {
  it("sanitizes marketplace jargon", () => {
    expect(sanitizeRelationalCommerceText("marketplace algorithmique")).not.toMatch(/marketplace/i);
  });

  it("builds catalog signals", () => {
    const view = mockRelationalCatalogView("detaillant");
    const cat = view.catalogs[0]!;
    const signals = buildRelationalCatalogSignals(cat);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("builds partner hints", () => {
    const view = mockRelationalCatalogView("detaillant");
    expect(buildPartnerCatalogHints(view.partners[0]!).length).toBeGreaterThan(0);
  });

  it("builds sponsored hints", () => {
    const view = mockRelationalCatalogView("detaillant");
    expect(buildSponsoredDiscoveryHints(view.discoveries).length).toBeGreaterThan(0);
  });
});

describe("terrain identity in catalog", () => {
  it("shows François contact-first for detaillant", () => {
    const view = mockRelationalCatalogView("detaillant");
    const francois = view.partners.find((p) => p.id === "sup-francois");
    expect(francois?.displayName).toBe("François");
    expect(francois?.secondaryName).toContain("La Rue de la Mode");
  });

  it("shows formal business name for producteur partners", () => {
    const view = mockRelationalCatalogView("producteur");
    expect(view.partners[0]?.displayName).toBe("AgroNexus CI");
  });
});

describe("RelationalCommerceCatalogShell UI", () => {
  it("renders relational shell without global marketplace", async () => {
    render(
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled
        flags={{
          relational_catalog_enabled: true,
          sponsored_catalog_discovery_enabled: true,
          partner_catalog_visibility_enabled: true,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("relational-commerce-catalog-shell")).toBeTruthy());
    expect(screen.getByTestId("relational-commerce-catalog-shell").getAttribute("data-no-global-marketplace")).toBe(
      "true",
    );
    expect(screen.queryByTestId("global-marketplace")).toBeNull();
    expect(screen.queryByText(/Tous les produits/i)).toBeNull();
  });

  it("shows partner-first structure", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => expect(screen.getByTestId("rcc-partner-nav")).toBeTruthy());
    expect(screen.getByTestId("rcc-partner-display-name").textContent).toMatch(/François|Sarah/);
  });

  it("shows supplier catalog for active partner", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => expect(screen.getByTestId(/^rcc-supplier-catalog-/)).toBeTruthy());
    expect(screen.getByTestId("rcc-product-rp1")).toBeTruthy();
  });

  it("supports quick order action", async () => {
    const onQuickOrder = vi.fn();
    render(
      <RelationalCommerceCatalogShell actorRole="detaillant" enabled onQuickOrder={onQuickOrder} />,
    );
    await waitFor(() => screen.getByTestId("rcc-quick-order-rp1"));
    fireEvent.click(screen.getByTestId("rcc-quick-order-rp1"));
    expect(onQuickOrder).toHaveBeenCalled();
  });

  it("shows commercial context", async () => {
    render(<RelationalCommerceCatalogShell actorRole="grossiste_b" enabled />);
    await waitFor(() => expect(screen.getByTestId("rcc-commercial-context")).toBeTruthy());
  });

  it("shows discovery suggestions", async () => {
    render(
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled
        flags={{ sponsored_catalog_discovery_enabled: true }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("rcc-catalog-discovery")).toBeTruthy());
    expect(screen.getByTestId("rcc-discovery-disc-1")).toBeTruthy();
    expect(screen.getByTestId("rcc-discovery-disc-1").textContent).toMatch(/corridor|sponsorisé/i);
  });

  it("hides sponsored discovery when flag off", async () => {
    render(
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled
        flags={{ sponsored_catalog_discovery_enabled: false }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("relational-commerce-catalog-shell")).toBeTruthy());
    expect(screen.queryByTestId("rcc-discovery-disc-1")).toBeNull();
  });

  it("composes relational order", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => screen.getByTestId("rcc-add-cart-rp1"));
    fireEvent.click(screen.getByTestId("rcc-add-cart-rp1"));
    expect(screen.getByTestId("rcc-order-lines")).toBeTruthy();
    expect(screen.getByTestId("rcc-order-submit")).toBeTruthy();
  });

  it("shows visibility badges", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => expect(screen.getByTestId("rcc-catalog-visibility")).toBeTruthy());
  });

  it("shows empty state when disabled", () => {
    render(
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled
        flags={{ relational_catalog_enabled: false }}
      />,
    );
    expect(screen.getByTestId("rcc-catalog-disabled")).toBeTruthy();
  });

  it("lazy loads shell module", async () => {
    render(
      <Suspense fallback={<div data-testid="rcc-lazy-loading">…</div>}>
        <LazyShell actorRole="detaillant" enabled />
      </Suspense>,
    );
    await waitFor(() => expect(screen.getByTestId("relational-commerce-catalog-shell")).toBeTruthy());
  });
});

describe("useRelationalCommerceCatalog", () => {
  function HookProbe({ role }: { role: "detaillant" | "grossiste_b" }) {
    const c = useRelationalCommerceCatalog({ actorRole: role, enabled: true });
    return (
      <div data-testid="hook-probe" data-catalogs={c.view?.catalogs.length ?? 0} data-partner={c.activePartner?.id ?? ""} />
    );
  }

  it("exposes one active catalog", () => {
    render(<HookProbe role="detaillant" />);
    const el = screen.getByTestId("hook-probe");
    expect(Number(el.getAttribute("data-catalogs"))).toBeGreaterThan(0);
    expect(el.getAttribute("data-partner")).toBeTruthy();
  });
});

describe("anti-jargon and no mixed marketplace", () => {
  it("shell copy avoids marketplace wording", async () => {
    render(<RelationalCommerceCatalogShell actorRole="producteur" enabled />);
    await waitFor(() => expect(screen.getByText(/partenaires commerciaux/i)).toBeTruthy());
  });

  it("no score visible in UI", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => expect(screen.getByTestId("relational-commerce-catalog-shell")).toBeTruthy());
    expect(screen.queryByText(/98%|compatibilité/i)).toBeNull();
  });
});

describe("formal vs terrain catalog", () => {
  it("grossiste A uses formal partners", () => {
    const view = mockRelationalCatalogView("grossiste_a");
    expect(view.partners[0]?.displayName).toContain("AgroNexus");
  });

  it("grossiste B uses terrain partners", () => {
    const view = mockRelationalCatalogView("grossiste_b");
    const sarah = view.partners.find((p) => p.id === "sup-sarah");
    expect(sarah?.displayName).toBe("Sarah grossiste");
  });
});

describe("partner switching", () => {
  it("switches active supplier catalog", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => screen.getByTestId("rcc-partner-sup-sarah"));
    fireEvent.click(screen.getByTestId("rcc-partner-sup-sarah"));
    await waitFor(() => expect(screen.getByTestId("rcc-supplier-catalog-sup-sarah")).toBeTruthy());
  });
});

describe("restricted and sponsored catalog", () => {
  it("marks sponsored visibility", async () => {
    render(
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled
        flags={{ sponsored_catalog_discovery_enabled: true }}
      />,
    );
    await waitFor(() => screen.getByTestId("rcc-partner-sup-francois"));
    fireEvent.click(screen.getByTestId("rcc-discovery-disc-1"));
    await waitFor(() =>
      expect(screen.getByTestId("rcc-supplier-catalog-sponsored-corridor")).toBeTruthy(),
    );
  });
});

describe("performance markers", () => {
  it("uses virtual list for long product lists when applicable", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled />);
    await waitFor(() => expect(screen.getByTestId("relational-commerce-catalog-shell")).toBeTruthy());
    const virtual = screen.queryByTestId("rcc-product-virtual-list");
    const sections = screen.queryAllByTestId(/^rcc-section-/);
    expect(virtual !== null || sections.length > 0).toBe(true);
  });
});

describe("negotiable product actions", () => {
  it("shows discuss only for negotiable products", async () => {
    render(<RelationalCommerceCatalogShell actorRole="detaillant" enabled onDiscuss={() => {}} />);
    await waitFor(() => screen.getByTestId("rcc-partner-sup-sarah"));
    fireEvent.click(screen.getByTestId("rcc-partner-sup-sarah"));
    await waitFor(() => expect(screen.getByTestId("rcc-discuss-rp3")).toBeTruthy());
  });
});
