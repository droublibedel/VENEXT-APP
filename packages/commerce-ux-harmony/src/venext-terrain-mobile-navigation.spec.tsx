/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "./index";

describe("VenextTerrainMobileHeader (VENEXT-MOBILE-UX-03)", () => {
  afterEach(() => cleanup());

  it("places profile left and messaging right with search and notifications", () => {
    render(
      <VenextTerrainMobileHeader
        onMessaging={() => {}}
        onSearch={() => {}}
        onProfile={() => {}}
        notificationsSlot={<span data-testid="notif-slot">N</span>}
      />,
    );
    expect(screen.getByTestId("venext-terrain-mobile-header-profile")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-messaging")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-search")).toBeTruthy();
    expect(screen.getByTestId("notif-slot")).toBeTruthy();
    expect(screen.queryByTestId("venext-terrain-mobile-header-title")).toBeNull();
    expect(screen.getByTestId("venext-terrain-mobile-header-logo")).toBeTruthy();
  });

  it("invokes header actions in UX-03 order", () => {
    const onMessaging = vi.fn();
    const onSearch = vi.fn();
    const onProfile = vi.fn();
    render(
      <VenextTerrainMobileHeader
        onMessaging={onMessaging}
        onSearch={onSearch}
        onProfile={onProfile}
        notificationsSlot={null}
      />,
    );
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-profile"));
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-search"));
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-messaging"));
    expect(onProfile).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onMessaging).toHaveBeenCalledOnce();
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
