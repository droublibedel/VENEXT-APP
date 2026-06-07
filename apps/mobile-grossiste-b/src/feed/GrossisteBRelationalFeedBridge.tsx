import { useMemo } from "react";

import { getCommercialLocationProfile } from "commercial-location-terrain";
import { RelationalCommerceFeedShell } from "relational-commerce-feed";
import "relational-commerce-feed/styles.css";

import { useGrossisteNetworkData } from "../hooks/useGrossisteNetworkData";
import { loadGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

function resolveViewerCity(): string {
  const legacy = loadGrossisteBOnboardingProfile();
  const actorId = legacy?.organizationId || resolveGrossisteBOrganizationId();
  const loc = getCommercialLocationProfile(actorId);
  return loc?.city ?? legacy?.city ?? "";
}

export function GrossisteBRelationalFeedBridge({ enabled = true }: { enabled?: boolean }) {
  const { data } = useGrossisteNetworkData(enabled);
  const partnerIds = useMemo(() => {
    const recent = data?.recentPartners?.map((p) => p.id) ?? [];
    const active = data?.activePartners?.map((p) => p.id) ?? [];
    return [...new Set([...recent, ...active])];
  }, [data]);

  const categories = useMemo(() => {
    const legacy = loadGrossisteBOnboardingProfile();
    return legacy?.activities?.length ? legacy.activities : [];
  }, []);

  return (
    <RelationalCommerceFeedShell
      actorId={resolveGrossisteBOrganizationId()}
      role="grossiste_b"
      city={resolveViewerCity()}
      categories={categories}
      partnerIds={partnerIds}
      partnersPublished={partnerIds.length > 0}
      testId="grossiste-b-relational-feed"
    />
  );
}
