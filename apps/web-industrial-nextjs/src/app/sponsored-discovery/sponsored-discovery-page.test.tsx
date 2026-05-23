import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SponsoredDiscoveryPage from "./page";

afterEach(() => {
  cleanup();
});

describe("Instruction 20.2A — sponsored discovery page UX", () => {
  it("surfaces controlled copy and avoids marketplace / buy-now wording", () => {
    render(<SponsoredDiscoveryPage />);
    expect(screen.getByText(/Conversation sponsorisée temporaire/i)).toBeTruthy();
    expect(screen.getByText(/catalogue complet/i)).toBeTruthy();
    expect(screen.getByText(/Commande relationnelle normale impossible sans relation acceptée/i)).toBeTruthy();
    expect(screen.queryByText(/buy now/i)).toBeNull();
    expect(screen.queryByText(/marketplace/i)).toBeNull();
  });
});
