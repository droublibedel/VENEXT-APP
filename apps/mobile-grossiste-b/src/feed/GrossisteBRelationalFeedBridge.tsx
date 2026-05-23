import { getCommercialLocationProfile } from "commercial-location-terrain";
import { RelationalCommerceFeedShell } from "relational-commerce-feed";
import "relational-commerce-feed/styles.css";

import { loadGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";

const GROSSISTE_ORG = "org-grossiste-b-demo";

function resolveViewerCity(): string {
  const loc = getCommercialLocationProfile(loadGrossisteBOnboardingProfile()?.phone || GROSSISTE_ORG);
  const legacy = loadGrossisteBOnboardingProfile();
  return loc?.city ?? legacy?.city ?? "Abidjan";
}

export function GrossisteBRelationalFeedBridge({
  partnerIds = [],
  partnersPublished = true,
}: {
  partnerIds?: string[];
  partnersPublished?: boolean;
}) {
  return (
    <RelationalCommerceFeedShell
      actorId={GROSSISTE_ORG}
      role="grossiste_b"
      city={resolveViewerCity()}
      categories={["chaussures", "distribution"]}
      partnerIds={partnerIds}
      partnersPublished={partnersPublished}
      testId="grossiste-b-relational-feed"
    />
  );
}
