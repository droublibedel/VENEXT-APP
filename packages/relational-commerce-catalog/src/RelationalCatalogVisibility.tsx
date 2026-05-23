import { memo } from "react";

import type { CatalogVisibilityMode, CommercialRelationshipLevel } from "./relational-commerce-catalog.types";

const VIS_LABEL: Record<CatalogVisibilityMode, string> = {
  RELATION_ONLY: "Catalogue relationnel",
  PARTNER_APPROVED: "Partenaire approuvé",
  NETWORK_EXTENDED: "Réseau étendu",
  SPONSORED_DISCOVERY: "Découverte sponsorisée",
  HIDDEN: "Masqué",
};

const REL_LABEL: Record<CommercialRelationshipLevel, string> = {
  NONE: "Aucune relation",
  CONTACT_DISCOVERED: "Contact découvert",
  INVITED: "Invitation en cours",
  APPROVED: "Approuvé",
  ACTIVE: "Relation active",
  PRIORITY_PARTNER: "Partenaire prioritaire",
};

export const RelationalCatalogVisibility = memo(function RelationalCatalogVisibility({
  visibilityMode,
  relationshipLevel,
  sponsored,
  restricted,
}: {
  visibilityMode: CatalogVisibilityMode;
  relationshipLevel: CommercialRelationshipLevel;
  sponsored?: boolean;
  restricted?: boolean;
}) {
  return (
    <div className="rcc-visibility" data-testid="rcc-catalog-visibility">
      <span data-testid="rcc-visibility-mode">{VIS_LABEL[visibilityMode]}</span>
      <span data-testid="rcc-relationship-level"> · {REL_LABEL[relationshipLevel]}</span>
      {sponsored ? <span data-testid="rcc-sponsored-badge"> · Sponsorisation légère</span> : null}
      {restricted ? <span data-testid="rcc-restricted-badge"> · Catalogue restreint</span> : null}
    </div>
  );
});
