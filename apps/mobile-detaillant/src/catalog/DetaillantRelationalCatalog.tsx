import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import "relational-commerce-catalog/styles.css";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

const RelationalCommerceCatalogShell = lazy(() =>
  import("relational-commerce-catalog").then((m) => ({
    default: m.RelationalCommerceCatalogShell,
  })),
);

export const DetaillantRelationalCatalog = memo(function DetaillantRelationalCatalog({
  enabled,
  contextRouting,
}: {
  enabled: boolean;
  contextRouting?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const relationalOn = hydrated && flags.relational_catalog_enabled !== false;

  if (!relationalOn) return null;

  return (
    <Suspense fallback={<VenextScreenLoader variant="catalog" />}>
      <RelationalCommerceCatalogShell
        actorRole="detaillant"
        enabled={enabled}
        contextRouting={contextRouting}
        flags={{
          relational_catalog_enabled: flags.relational_catalog_enabled,
          sponsored_catalog_discovery_enabled: flags.sponsored_catalog_discovery_enabled,
          partner_catalog_visibility_enabled: flags.partner_catalog_visibility_enabled,
        }}
      />
    </Suspense>
  );
});
