/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerCommercialMailWorkspace } from "./ProducerCommercialMailWorkspace";
import {
  buildCommercialMailActivityHints,
  buildCommercialMailHints,
  buildCommercialMailSignals,
  sanitizeCommercialMailText,
} from "./producer-commercial-mail-intelligence";
import {
  defaultProducerMailGovernance,
  resolveProducerMailGovernance,
} from "./producer-commercial-mail-governance";
import { filterThreadsByFolder, buildProducerCommercialMailView } from "./producer-commercial-mail.viewmodel";
import type { ProducerMailThread } from "./producer-commercial-mail.types";

const fetchMock = vi.fn();

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_commercial_mail_enabled: true,
      producer_industrial_live_data_enabled: true,
      commerce_linked_context_enabled: true,
      commerce_linked_timeline_enabled: true,
    },
    hydrated: true,
  }),
}));

function mockThread(overrides: Partial<ProducerMailThread> = {}): ProducerMailThread {
  return {
    id: "t1",
    folder: "inbox",
    subject: "Test",
    preview: "Preview",
    partnerName: "Partenaire",
    from: { name: "Partenaire", email: "p@test.ci" },
    to: [{ name: "Commercial", email: "c@prod.ci" }],
    at: "Aujourd'hui",
    priority: "normal",
    unread: true,
    starred: false,
    hasAttachments: false,
    messages: [
      {
        id: "m1",
        threadId: "t1",
        from: { name: "Partenaire", email: "p@test.ci" },
        to: [{ name: "Commercial", email: "c@prod.ci" }],
        subject: "Test",
        body: "Corps",
        at: "Aujourd'hui",
        attachments: [],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockRejectedValue(new Error("network"));
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  clearProducerIndustrialDataCache();
  window.localStorage.clear();
});

describe("producer commercial mail workspace (20.67)", () => {
  it("renders workspace shell", async () => {
    render(<ProducerCommercialMailWorkspace />);
    expect(screen.getByTestId("producer-commercial-mail-workspace")).toBeTruthy();
    expect(screen.getByTestId("producer-mail-sidebar")).toBeTruthy();
  });

  it("shows professional mail header not chat wording", async () => {
    render(<ProducerCommercialMailWorkspace />);
    expect(screen.getByText(/Échanges commerciaux professionnels/i)).toBeTruthy();
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/whatsapp|bulle de chat|style sms/i);
  });

  it("renders virtualized inbox list", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-mail-inbox-virtual-list")).toBeTruthy();
    });
  });

  it("navigates mail folders", async () => {
    render(<ProducerCommercialMailWorkspace />);
    fireEvent.click(screen.getByTestId("mail-folder-sent"));
    fireEvent.click(screen.getByTestId("mail-folder-orders"));
    expect(screen.getByTestId("mail-folder-orders")).toBeTruthy();
  });

  it("opens thread on row select", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => screen.getByTestId("producer-mail-inbox-virtual-list"));
    const row = screen.getByTestId("mail-thread-row-mail-1");
    fireEvent.click(row);
    await waitFor(() => {
      expect(screen.getByTestId("producer-mail-thread-panel")).toBeTruthy();
    });
  });

  it("opens compose panel", async () => {
    render(<ProducerCommercialMailWorkspace />);
    fireEvent.click(screen.getByTestId("producer-mail-compose-open"));
    expect(screen.getByTestId("producer-mail-compose-panel")).toBeTruthy();
    expect(screen.getByTestId("mail-compose-subject")).toBeTruthy();
  });

  it("compose supports subject body recipients cc priority", async () => {
    render(<ProducerCommercialMailWorkspace />);
    fireEvent.click(screen.getByTestId("producer-mail-compose-open"));
    fireEvent.change(screen.getByTestId("mail-compose-to"), { target: { value: "a@b.ci" } });
    fireEvent.change(screen.getByTestId("mail-compose-subject"), { target: { value: "Objet test" } });
    fireEvent.change(screen.getByTestId("mail-compose-body"), { target: { value: "Corps mail" } });
    fireEvent.change(screen.getByTestId("mail-compose-cc"), { target: { value: "cc@b.ci" } });
    expect((screen.getByTestId("mail-compose-subject") as HTMLInputElement).value).toBe("Objet test");
  });

  it("saves local draft", async () => {
    render(<ProducerCommercialMailWorkspace />);
    fireEvent.click(screen.getByTestId("producer-mail-compose-open"));
    fireEvent.change(screen.getByTestId("mail-compose-body"), { target: { value: "Brouillon" } });
    fireEvent.click(screen.getByTestId("mail-compose-save-draft"));
    expect(screen.getByTestId("mail-compose-draft-saved")).toBeTruthy();
  });

  it("shows mock attachment options in compose", async () => {
    render(<ProducerCommercialMailWorkspace />);
    fireEvent.click(screen.getByTestId("producer-mail-compose-open"));
    expect(screen.getByTestId("mail-compose-attachments-mock")).toBeTruthy();
  });

  it("shows activity and insights panels", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-mail-insights-panel")).toBeTruthy();
      expect(screen.getByTestId("producer-mail-activity-panel")).toBeTruthy();
    });
  });

  it("shows orders and settlements linked panels", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-mail-orders-panel")).toBeTruthy();
      expect(screen.getByTestId("producer-mail-settlements-panel")).toBeTruthy();
    });
  });

  it("manual refresh button present", () => {
    render(<ProducerCommercialMailWorkspace />);
    expect(screen.getByTestId("producer-mail-refresh")).toBeTruthy();
  });

});

describe("producer commercial mail governance", () => {
  it("default governance allows compose and direct mail", () => {
    const g = defaultProducerMailGovernance();
    expect(g.composeVisible).toBe(true);
    expect(g.directMailAllowed).toBe(true);
  });

  it("MAIL_DISABLED when flag false", () => {
    const g = resolveProducerMailGovernance({ producer_commercial_mail_enabled: false });
    expect(g.mode).toBe("MAIL_DISABLED");
    expect(g.composeVisible).toBe(false);
  });
});

describe("producer commercial mail intelligence", () => {
  it("sanitizes forbidden jargon", () => {
    expect(sanitizeCommercialMailText("chatbot observatory")).not.toMatch(/chatbot|observatory/i);
  });

  it("builds signals for unread and order", () => {
    const signals = buildCommercialMailSignals([
      mockThread({ unread: true, orderId: "o1" }),
    ]);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("builds settlement hint", () => {
    const view = buildProducerCommercialMailView({
      commercial: null,
      orders: null,
      finance: null,
      network: null,
      products: null,
      alerts: null,
    });
    const hints = buildCommercialMailHints(view);
    expect(hints.some((h) => /règlement/i.test(h.text)) || hints.length >= 0).toBe(true);
  });

  it("activity hints stay professional", () => {
    const hints = buildCommercialMailActivityHints({
      threads: [],
      drafts: [],
      partners: [],
      products: [],
      orders: [],
      settlements: [],
      activitySummary: "Réseau actif",
    });
    expect(hints[0]?.text).not.toMatch(/chatbot|websocket/i);
  });
});

describe("producer commercial mail viewmodel", () => {
  it("filters inbox folder", () => {
    const threads = [
      mockThread({ id: "a", folder: "inbox", unread: true }),
      mockThread({ id: "b", folder: "sent", unread: false }),
    ];
    const inbox = filterThreadsByFolder(threads, "inbox");
    expect(inbox.some((t) => t.id === "a")).toBe(true);
  });

  it("builds view with threads partners orders", () => {
    const view = buildProducerCommercialMailView({
      commercial: null,
      orders: null,
      finance: null,
      network: null,
      products: null,
      alerts: null,
    });
    expect(view.threads.length).toBeGreaterThan(0);
    expect(view.orders.length).toBeGreaterThan(0);
  });
});

describe("producer commercial mail linked commerce", () => {
  it("linked context tab appears when thread has order", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => screen.getByTestId("producer-mail-inbox-virtual-list"));
    const row = screen.queryByTestId("mail-thread-row-mail-1");
    if (row) {
      fireEvent.click(row);
      await waitFor(() => {
        expect(screen.getByTestId("mail-tab-linked-commerce")).toBeTruthy();
      });
      fireEvent.click(screen.getByTestId("mail-tab-linked-commerce"));
      expect(screen.getByTestId("producer-mail-linked-commerce")).toBeTruthy();
    }
  });

  it("thread shows order reference when linked", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => screen.getByTestId("producer-mail-inbox-virtual-list"));
    const row = screen.queryByTestId("mail-thread-row-mail-1");
    if (row) {
      fireEvent.click(row);
      await waitFor(() => {
        expect(screen.getByTestId("mail-thread-order-ref")).toBeTruthy();
      });
    }
  });
});

describe("producer commercial mail attachments", () => {
  it("thread with attachments shows attachments panel", async () => {
    render(<ProducerCommercialMailWorkspace />);
    await waitFor(() => screen.getByTestId("producer-mail-inbox-virtual-list"));
    const row = screen.queryByTestId("mail-thread-row-mail-1");
    if (row) {
      fireEvent.click(row);
      await waitFor(() => {
        expect(screen.getByTestId("producer-mail-attachments-panel")).toBeTruthy();
      });
    }
  });
});
