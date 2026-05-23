import type { MarketingActivationBundleResponse } from "@venext/shared-contracts";
import { describe, expect, it } from "vitest";

import { buildMarketingActivationCanvasGeo } from "./marketing-activation-canvas-adapter";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

describe("buildMarketingActivationCanvasGeo", () => {
  it("uses live bundle cells when present", () => {
    const bundle = {
      version: "1" as const,
      generatedAt: new Date().toISOString(),
      organizationId: DEMO_ORG,
      overview: {} as MarketingActivationBundleResponse["overview"],
      sponsorshipPressure: {} as MarketingActivationBundleResponse["sponsorshipPressure"],
      territoryRadar: {} as MarketingActivationBundleResponse["territoryRadar"],
      productMomentum: {} as MarketingActivationBundleResponse["productMomentum"],
      retailerEngagement: {} as MarketingActivationBundleResponse["retailerEngagement"],
      campaigns: {} as MarketingActivationBundleResponse["campaigns"],
      briefing: {} as MarketingActivationBundleResponse["briefing"],
      interventions: {} as MarketingActivationBundleResponse["interventions"],
      opportunityMap: {
        generatedAt: new Date().toISOString(),
        organizationId: DEMO_ORG,
        mode: "sponsorship",
        legend: "l",
        cells: [{ territoryKey: "SN/Dakar", label: "Dakar", heat: 0.77 }],
        controls: ["momentum"],
        mapEngine: "MapControlEngine_layers",
        policy: "ACTIVE",
        modeComputation: {
          mode: "sponsorship",
          primarySignals: ["x"],
          formulaVersion: "13A_MODE_HEAT_V2",
          mockContextUsed: false,
        },
      },
    } as MarketingActivationBundleResponse;
    const out = buildMarketingActivationCanvasGeo(bundle);
    expect(out.source).toBe("marketing_activation_bundle");
    expect((out.zones.features as { properties: { tension: number } }[])[0].properties.tension).toBeCloseTo(0.77);
  });

  it("falls back when bundle is null or has no cells", () => {
    const out = buildMarketingActivationCanvasGeo(null);
    expect(out.source).toBe("demo_operational_fallback");
    expect(out.zones.type).toBe("FeatureCollection");
  });
});
