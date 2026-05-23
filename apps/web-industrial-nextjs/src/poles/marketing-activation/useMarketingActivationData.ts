"use client";

import type { MarketingActivationBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchMarketingActivationBundleJson, fetchMarketingActivationJson } from "./marketing-activation-api";

export type MarketingActivationBundle = {
  overview: unknown;
  sponsorshipPressure: unknown;
  territoryRadar: unknown;
  productMomentum: unknown;
  retailerEngagement: unknown;
  campaigns: unknown;
  opportunityMap: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useMarketingActivationData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<MarketingActivationBundle>>({});
  const [loading, setLoading] = useState(true);
  const [hydratedVia, setHydratedVia] = useState<"bundle" | "parallel" | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setHydratedVia(null);

    void (async () => {
      let packed = await fetchMarketingActivationBundleJson<MarketingActivationBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchMarketingActivationBundleJson<MarketingActivationBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          sponsorshipPressure: packed.sponsorshipPressure,
          territoryRadar: packed.territoryRadar,
          productMomentum: packed.productMomentum,
          retailerEngagement: packed.retailerEngagement,
          campaigns: packed.campaigns,
          opportunityMap: packed.opportunityMap,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const [
        overview,
        sponsorshipPressure,
        territoryRadar,
        productMomentum,
        retailerEngagement,
        campaigns,
        opportunityMap,
        briefing,
        interventions,
      ] = await Promise.all([
        fetchMarketingActivationJson("/overview", organizationId),
        fetchMarketingActivationJson("/sponsorship-pressure", organizationId),
        fetchMarketingActivationJson("/territory-radar", organizationId),
        fetchMarketingActivationJson("/product-momentum", organizationId),
        fetchMarketingActivationJson("/retailer-engagement", organizationId),
        fetchMarketingActivationJson("/campaigns", organizationId),
        fetchMarketingActivationJson("/opportunity-map?mode=momentum", organizationId),
        fetchMarketingActivationJson("/briefing", organizationId),
        fetchMarketingActivationJson("/interventions", organizationId),
      ]);
      if (cancelled) return;
      setBundle({
        overview: overview ?? undefined,
        sponsorshipPressure: sponsorshipPressure ?? undefined,
        territoryRadar: territoryRadar ?? undefined,
        productMomentum: productMomentum ?? undefined,
        retailerEngagement: retailerEngagement ?? undefined,
        campaigns: campaigns ?? undefined,
        opportunityMap: opportunityMap ?? undefined,
        briefing: briefing ?? undefined,
        interventions: interventions ?? undefined,
      });
      setHydratedVia("parallel");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  return { bundle, loading, hydratedVia };
}
