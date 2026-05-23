import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VenextLanguageSelector, VenextLocaleProvider, useVenextT } from "./index";

function Probe() {
  const t = useVenextT();
  return <span data-testid="probe">{t("app.name")}</span>;
}

describe("venext i18n integration (20.77)", () => {
  it("provider renders children after preload", async () => {
    render(
      <VenextLocaleProvider isDev={false}>
        <Probe />
      </VenextLocaleProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("VENEXT");
    });
  });

  it("language selector lists four locales", async () => {
    render(
      <VenextLocaleProvider isDev={false}>
        <VenextLanguageSelector />
      </VenextLocaleProvider>,
    );
    await waitFor(() => {
      const select = screen.getByTestId("venext-language-selector-select") as HTMLSelectElement;
      expect(select.options.length).toBe(4);
    });
  });

  it("memoization — same translation stable across rerenders", async () => {
    const seen: string[] = [];
    function Counter() {
      const t = useVenextT();
      seen.push(t("app.loading"));
      return <span data-testid="c">{seen.length}</span>;
    }
    const { rerender } = render(
      <VenextLocaleProvider isDev={false}>
        <Counter />
      </VenextLocaleProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("c")).toBeTruthy());
    rerender(
      <VenextLocaleProvider isDev={false}>
        <Counter />
      </VenextLocaleProvider>,
    );
    await waitFor(() => {
      expect(seen[0]).toBeTruthy();
      expect(seen[0]).toBe(seen[seen.length - 1]);
    });
  });
});
