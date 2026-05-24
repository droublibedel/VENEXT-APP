import { useMemo } from "react";

import { getCommercialLocationProfile } from "commercial-location-terrain";
import { RelationalCommerceFeedShell } from "relational-commerce-feed";
import "relational-commerce-feed/styles.css";

import { useDetaillantNetworkData } from "../hooks/useDetaillantNetworkData";
import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

function resolveViewerCity(): string {
  const legacy = loadDetaillantOnboardingProfile();
  const actorId = resolveDetaillantOrganizationId();
  const loc = getCommercialLocationProfile(actorId);
  return loc?.city ?? legacy?.city ?? "";
}

export function DetaillantRelationalFeedBridge({ enabled = true }: { enabled?: boolean }) {
  const { data } = useDetaillantNetworkData(enabled);
  const partnerIds = useMemo(() => {
    const suppliers = data?.activeSuppliers?.map((s) => s.id) ?? [];
    const partners = data?.newPartners?.map((p) => p.id) ?? [];
    return [...new Set([...suppliers, ...partners])];
  }, [data]);

  const categories = useMemo(() => {
    const legacy = loadDetaillantOnboardingProfile();
    return legacy?.activities?.length ? legacy.activities : [];
  }, []);

  const city = resolveViewerCity();

  return (
    <RelationalCommerceFeedShell
      actorId={resolveDetaillantOrganizationId()}
      role="detaillant"
      city={city}
      categories={categories}
      partnerIds={partnerIds}
      partnersPublished={partnerIds.length > 0}
      testId="detaillant-relational-feed"
    />
  );
}
