import { memo, useMemo } from "react";

import {
  buildCommercialDiscoveryHints,
  buildCommercialRelationshipHints,
} from "./commercial-network-discovery-intelligence";
import type { CommercialDiscoveryView } from "./commercial-network-discovery.types";

export const CommercialDiscoveryInsights = memo(function CommercialDiscoveryInsights({
  view,
}: {
  view: CommercialDiscoveryView | null;
}) {
  const hints = useMemo(() => {
    return [...buildCommercialDiscoveryHints(view), ...buildCommercialRelationshipHints(view)].slice(0, 4);
  }, [view]);

  if (!hints.length) return null;

  return (
    <section data-testid="cnd-discovery-insights">
      {hints.map((h) => (
        <p key={h.id} className="cnd-hint" style={{ marginBottom: 6 }} data-testid={`cnd-hint-${h.id}`}>
          {h.text}
        </p>
      ))}
    </section>
  );
});
