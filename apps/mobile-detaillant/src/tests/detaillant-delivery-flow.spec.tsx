/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DetaillantOrdersScreen } from "../screens/DetaillantOrdersScreen";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    hydrated: true,
    flags: {
      commercial_delivery_flow_enabled: true,
      commercial_reception_confirmation_enabled: true,
      commercial_delivery_activity_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useDetaillantOrdersData", () => ({
  useDetaillantOrdersData: () => ({
    data: { enCours: [], recues: [], terminees: [] },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("detaillant delivery flow (20.74)", () => {
  it("renders delivery on orders screen", async () => {
    render(<DetaillantOrdersScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
  });
});
