/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "./index";

describe("VenextTerrainMobileHeader", () => {
  afterEach(() => cleanup());

  it("renders messaging, title, search, notifications slot and profile", () => {
    render(
      <VenextTerrainMobileHeader
        title="Accueil"
        brandLabel="VENEXT"
        onMessaging={() => {}}
        onSearch={() => {}}
        onProfile={() => {}}
        notificationsSlot={<span data-testid="notif-slot">N</span>}
      />,
    );
    expect(screen.getByTestId("venext-terrain-mobile-header")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-messaging")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-search")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-profile")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-title").textContent).toContain("Accueil");
    expect(screen.getByTestId("notif-slot")).toBeTruthy();
  });

  it("invokes header actions", () => {
    const onMessaging = vi.fn();
    const onSearch = vi.fn();
    const onProfile = vi.fn();
    render(
      <VenextTerrainMobileHeader
        title="Réseau"
        onMessaging={onMessaging}
        onSearch={onSearch}
        onProfile={onProfile}
        notificationsSlot={null}
      />,
    );
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-messaging"));
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-search"));
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-profile"));
    expect(onMessaging).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onProfile).toHaveBeenCalledOnce();
  });
});

describe("VenextTerrainGlobalSearch", () => {
  afterEach(() => cleanup());

  it("calls fetchSearch API when query is entered", async () => {
    const fetchSearch = vi.fn().mockResolvedValue({
      query: "riz",
      results: [{ id: "p1", kind: "product", label: "Riz 25kg" }],
    });
    render(
      <VenextTerrainGlobalSearch
        open
        onClose={() => {}}
        organizationId="org-detaillant-demo"
        actorRole="DETAILLANT"
        fetchSearch={fetchSearch}
      />,
    );
    fireEvent.change(screen.getByTestId("terrain-global-search-input"), { target: { value: "riz" } });
    await waitFor(() => expect(fetchSearch).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("terrain-search-result-product-p1")).toBeTruthy(),
    );
  });
});
