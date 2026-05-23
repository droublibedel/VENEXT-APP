/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommerceConversationShell } from "../conversations/CommerceConversationShell";
import { CommerceMessageComposer } from "../messages/CommerceMessageComposer";
import { CommerceMessageThread } from "../messages/CommerceMessageThread";
import {
  buildConversationSignals,
  sanitizeCommerceText,
} from "../intelligence/commerce-messaging-intelligence";
import { clearCommerceMessagingCache } from "../hooks/useCommerceMessagingLiveData";
import { mockCommerceConversations, mockCommerceMessages } from "../mocks/commerce-messaging-mock-data";
import { CommerceOrderContextCard } from "../orders/CommerceOrderContextCard";
import { CommerceProductContextCard } from "../products/CommerceProductContextCard";
import { CommerceNetworkActivityStrip } from "../network/CommerceNetworkActivityStrip";
import { mockNetworkStrip, mockOrderContext, mockProductContext } from "../mocks/commerce-messaging-mock-data";

describe("commerce messaging foundation", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceMessagingCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("renders conversation list in sidebar", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("cm-conversation-list")).toBeTruthy());
    expect(screen.getByTestId("cm-conv-c1")).toBeTruthy();
  });

  it("renders category tabs", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("cm-category-tabs")).toBeTruthy());
    expect(screen.getByTestId("cm-cat-commandes")).toBeTruthy();
  });

  it("renders message thread for active conversation", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("cm-message-thread")).toBeTruthy());
    expect(screen.getByTestId("cm-msg-m1")).toBeTruthy();
  });

  it("renders composer with quick suggestions", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("cm-message-composer")).toBeTruthy());
    expect(screen.getByTestId("cm-composer-input")).toBeTruthy();
    expect(screen.getByTestId("cm-suggestion-produit-disponible")).toBeTruthy();
  });

  it("renders product context card", () => {
    render(<CommerceProductContextCard context={mockProductContext()} />);
    expect(screen.getByTestId("cm-product-context")).toBeTruthy();
    expect(screen.getByText(/Riz 25kg/)).toBeTruthy();
  });

  it("renders order context card", () => {
    render(<CommerceOrderContextCard context={mockOrderContext()} />);
    expect(screen.getByTestId("cm-order-context")).toBeTruthy();
    expect(screen.getByText(/Boutique Plateau/)).toBeTruthy();
  });

  it("renders network activity strip", () => {
    render(<CommerceNetworkActivityStrip strip={mockNetworkStrip("c1")} />);
    expect(screen.getByTestId("cm-network-strip")).toBeTruthy();
  });

  it("shows intelligence hints in shell", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => {
      const hints = screen.queryAllByTestId("cm-intelligence-hint");
      expect(hints.length).toBeGreaterThan(0);
    });
  });

  it("shows fallback demo data badge", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => {
      const badge = screen.getByTestId("cm-data-source");
      expect(badge.getAttribute("data-fallback")).toBe("true");
      expect(badge.textContent).toContain("démonstration");
    });
  });

  it("sanitizes forbidden jargon", () => {
    expect(sanitizeCommerceText("governance observatory orchestration")).not.toMatch(
      /governance|observatory/i,
    );
    const signals = buildConversationSignals(mockCommerceConversations());
    for (const s of signals) {
      expect(s.text).not.toMatch(/orchestration|systemic/i);
    }
  });

  it("composer standalone renders", () => {
    render(<CommerceMessageComposer />);
    expect(screen.getByTestId("cm-message-composer")).toBeTruthy();
  });

  it("thread standalone renders messages", () => {
    render(<CommerceMessageThread messages={mockCommerceMessages("c1")} />);
    expect(screen.getByTestId("cm-message-thread")).toBeTruthy();
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
  });

  it("renders governance badges when governance enabled", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} governanceEnabled />);
    await waitFor(() => expect(screen.getByTestId("cm-account-governance")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("cm-conversation-governance-badge")).toBeTruthy(),
    );
  });

  it("hides composer for disabled industrial conversation", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} governanceEnabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-c3")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-c3"));
    await waitFor(() => expect(screen.getByTestId("cm-composer-hidden")).toBeTruthy());
  });

  it("shows fixed price suggestions for fixed product conversation", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} governanceEnabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-c6")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-c6"));
    await waitFor(() =>
      expect(screen.getByTestId("cm-suggestion-commande-validée")).toBeTruthy(),
    );
  });

  it("switches active conversation", async () => {
    render(<CommerceConversationShell enabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-c1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-c2"));
    await waitFor(() => {
      expect(document.querySelector(".cm-conv-item--active")?.getAttribute("data-testid")).toBe(
        "cm-conv-c2",
      );
    });
  });
});
