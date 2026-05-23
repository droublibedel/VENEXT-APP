import { memo } from "react";

import type { RelationalCommercialContextData } from "./relational-commerce-catalog.types";

export const RelationalCommercialContext = memo(function RelationalCommercialContext({
  context,
}: {
  context: RelationalCommercialContextData;
}) {
  return (
    <aside className="rcc-context" data-testid="rcc-commercial-context">
      <p className="rcc-context-line" data-testid="rcc-context-partner">
        Partenaire : <strong>{context.activePartnerName}</strong>
      </p>
      <p className="rcc-context-line">{context.relationshipLabel}</p>
      {context.recentOrdersLabel ? <p className="rcc-context-line">{context.recentOrdersLabel}</p> : null}
      {context.corridor ? <p className="rcc-context-line">{context.corridor}</p> : null}
      {context.activityLabel ? <p className="rcc-context-line">{context.activityLabel}</p> : null}
      {context.settlementLabel ? <p className="rcc-context-line">{context.settlementLabel}</p> : null}
      {context.networkAvailability ? (
        <p className="rcc-context-line rcc-context-muted">{context.networkAvailability}</p>
      ) : null}
    </aside>
  );
});
