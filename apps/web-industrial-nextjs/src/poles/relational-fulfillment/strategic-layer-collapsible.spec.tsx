import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StrategicLayerCollapsibleSection } from "./StrategicLayerCollapsibleSection";

describe("StrategicLayerCollapsibleSection", () => {
  it("renders collapsed by default and expands on toggle", async () => {
    const user = userEvent.setup();
    render(
      <StrategicLayerCollapsibleSection
        sectionId="test-section"
        title="Test section"
        subtitle="Collapsed default"
        layerCount={2}
        defaultOpen={false}
      >
        <p data-testid="child-panel">Child content</p>
      </StrategicLayerCollapsibleSection>,
    );

    const section = screen.getByTestId("strategic-layer-section-test-section");
    expect(section.getAttribute("data-expanded")).toBe("false");
    expect(screen.queryByTestId("child-panel")).toBeNull();

    await user.click(screen.getByTestId("strategic-layer-section-toggle-test-section"));
    expect(section.getAttribute("data-expanded")).toBe("true");
    expect(screen.getByTestId("child-panel")).toBeTruthy();
  });
});
