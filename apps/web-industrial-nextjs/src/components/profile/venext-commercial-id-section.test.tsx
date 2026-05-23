import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VenextCommercialIdSection } from "./venext-commercial-id-section";

afterEach(() => {
  cleanup();
});

describe("VenextCommercialIdSection (web profile contract)", () => {
  it("renders copy button for clipboard UX", () => {
    render(<VenextCommercialIdSection commercialId="4829173056" locale="en" />);
    expect(screen.getByTestId("venext-commercial-id-copy")).toBeTruthy();
  });

  it("writes commercialId to clipboard when copy is pressed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<VenextCommercialIdSection commercialId="5928173045" locale="en" />);
    fireEvent.click(screen.getByTestId("venext-commercial-id-copy"));
    expect(writeText).toHaveBeenCalledWith("5928173045");
  });
});
