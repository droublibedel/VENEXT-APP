import { memo } from "react";

import type { RelationalPartner } from "./relational-commerce-catalog.types";

export const RelationalPartnerHeader = memo(function RelationalPartnerHeader({
  partner,
}: {
  partner: RelationalPartner;
}) {
  return (
    <header className="rcc-partner-header" data-testid={`rcc-partner-header-${partner.id}`}>
      <p className="rcc-partner-name" data-testid="rcc-partner-display-name">
        {partner.displayName}
      </p>
      {partner.secondaryName ? (
        <p className="rcc-partner-secondary" data-testid="rcc-partner-secondary-name">
          {partner.secondaryName}
        </p>
      ) : null}
      <p className="rcc-partner-meta">
        {partner.partnerType}
        {partner.city ? ` · ${partner.city}` : ""}
      </p>
    </header>
  );
});
