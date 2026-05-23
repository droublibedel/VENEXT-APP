import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import "relational-commerce-catalog/styles.css";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { VenextWorkspaceLoader } from "../ux/VenextWorkspaceLoader";

const RelationalCommerceCatalogShell = lazy(() =>
  import("relational-commerce-catalog").then((m) => ({
    default: m.RelationalCommerceCatalogShell,
  })),
);

export const GrossisteARelationalCatalog = memo(function GrossisteARelationalCatalog({
  enabled,
  contextRouting,
}: {
  enabled: boolean;
  contextRouting?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const relationalOn = hydrated && flags.relational_catalog_enabled !== false;

  if (!relationalOn) return null;

  return (
    <Suspense fallback={<VenextWorkspaceLoader variant="catalog" />}>
      <RelationalCommerceCatalogShell
        actorRole="grossiste_a"
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
