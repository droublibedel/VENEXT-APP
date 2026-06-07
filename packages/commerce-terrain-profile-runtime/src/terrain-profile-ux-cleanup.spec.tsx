/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TerrainProfileSelectionStep } from "./TerrainProfileSelectionStep.js";

describe("VENEXT-UX-CLEANUP-01 terrain profile", () => {
  it("profile selection uses human headings", () => {
    render(
      <TerrainProfileSelectionStep selected={null} onSelect={() => {}} onContinue={() => {}} />,
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Commençons");
    expect(screen.queryByText(/profil principal/i)).toBeNull();
  });
});
