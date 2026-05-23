import { getCommercialLocationProfile } from "commercial-location-terrain";
import { RelationalCommerceFeedShell } from "relational-commerce-feed";
import "relational-commerce-feed/styles.css";

import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";

const DETAILLANT_ORG = "org-detaillant-demo";

function resolveViewerCity(): string {
  const legacy = loadDetaillantOnboardingProfile();
  const loc = getCommercialLocationProfile(legacy?.phone || DETAILLANT_ORG);
  return loc?.city ?? legacy?.city ?? "Yopougon";
}

export function DetaillantRelationalFeedBridge({
  partnerIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"],
  partnersPublished = false,
}: {
  partnerIds?: string[];
  partnersPublished?: boolean;
}) {
  return (
    <RelationalCommerceFeedShell
      actorId={DETAILLANT_ORG}
      role="detaillant"
      city={resolveViewerCity()}
      categories={["chaussures"]}
      partnerIds={partnerIds}
      partnersPublished={partnersPublished}
      testId="detaillant-relational-feed"
    />
  );
}
