/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { TerrainProfileSelectionStep } from "./TerrainProfileSelectionStep.js";
import type { TerrainProfileId } from "./types.js";

afterEach(() => cleanup());

describe("TerrainProfileSelectionStep", () => {
  it("requires profile choice before continue", () => {
    const onContinue = vi.fn();
    function Harness() {
      const [selected, setSelected] = useState<TerrainProfileId | null>(null);
      return (
        <TerrainProfileSelectionStep
          selected={selected}
          onSelect={setSelected}
          onContinue={onContinue}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByTestId("terrain-profile-continue")).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByTestId("terrain-profile-option-detaillant"));
    fireEvent.click(screen.getByTestId("terrain-profile-continue"));
    expect(onContinue).toHaveBeenCalled();
  });
});
