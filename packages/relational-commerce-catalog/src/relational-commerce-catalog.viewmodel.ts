import { applyTerrainIdentityToSuggestion } from "commercial-network-discovery";
import type { CommercialContactSuggestion } from "commercial-network-discovery";

import { filterVisibleCatalogs } from "./relational-commerce-catalog-governance";
import type {
  RelationalActorRole,
  RelationalCatalog,
  RelationalCatalogFlags,
  RelationalCatalogView,
  RelationalPartner,
  RelationalProduct,
} from "./relational-commerce-catalog.types";

function terrainPartner(
  actorRole: "grossiste_b" | "detaillant",
  id: string,
  localContactName: string | undefined,
  businessName: string,
  type: string,
  city: string,
  level: RelationalPartner["relationshipLevel"],
): RelationalPartner {
  const suggestion = applyTerrainIdentityToSuggestion(
    {
      id,
      phone: "+2250700000000",
      displayName: businessName,
      localContactName,
      registeredBusinessName: businessName,
      city,
      activityLabel: type,
      photoInitials: "??",
      matchKind: "mutual",
      partnerStatus: "connected",
      catalogPreviewCount: 0,
    } as CommercialContactSuggestion,
    actorRole,
    { commercial_contact_first_identity_enabled: true },
  );
  return {
    id,
    displayName: suggestion.displayName,
    secondaryName: suggestion.secondaryName,
    partnerType: type,
    city,
    relationshipLevel: level,
    localContactName,
    registeredBusinessName: businessName,
  };
}

function formalPartner(
  id: string,
  companyName: string,
  type: string,
  city: string,
  level: RelationalPartner["relationshipLevel"],
): RelationalPartner {
  return {
    id,
    displayName: companyName,
    secondaryName: `${type} · ${city}`,
    partnerType: type,
    city,
    relationshipLevel: level,
    registeredBusinessName: companyName,
  };
}

function products(seed: RelationalProduct[]): RelationalProduct[] {
  return seed;
}

export function mockRelationalCatalogView(
  actorRole: RelationalActorRole,
  flags: RelationalCatalogFlags = {},
): RelationalCatalogView {
  const isTerrain = actorRole === "grossiste_b" || actorRole === "detaillant";
  const isGrossisteB = actorRole === "grossiste_b";

  const partners: RelationalPartner[] = isTerrain
    ? [
        terrainPartner(
          actorRole,
          "sup-francois",
          isGrossisteB ? undefined : "François",
          "La Rue de la Mode",
          isGrossisteB ? "détaillant" : "grossiste B",
          "Adjamé",
          "ACTIVE",
        ),
        terrainPartner(
          actorRole,
          "sup-sarah",
          "Sarah grossiste",
          "Sarah Distribution",
          "grossiste B",
          "Bouaké",
          "PRIORITY_PARTNER",
        ),
        terrainPartner(
          actorRole,
          "sup-hidden",
          undefined,
          "Fournisseur non relié",
          "grossiste",
          "San Pedro",
          "NONE",
        ),
      ]
    : [
        formalPartner("prod-agro", "AgroNexus CI", "Producteur industriel", "San Pedro", "ACTIVE"),
        formalPartner("prod-ivoire", "Ivoire Alimentaire SA", "Producteur", "Abidjan", "APPROVED"),
        formalPartner("ga-nord", "Distribution Nord Plus", "Grossiste A", "Bouaké", "INVITED"),
      ];

  const catalogs: RelationalCatalog[] = [
    {
      supplierId: partners[0]!.id,
      supplierType: partners[0]!.partnerType,
      visibilityMode: "RELATION_ONLY",
      relationshipLevel: partners[0]!.relationshipLevel,
      territory: ["Adjamé", "Plateau"],
      products: products([
        {
          id: "rp1",
          name: "Eau minérale 1.5L x12",
          priceLabel: "4 200 FCFA",
          availability: "available",
          category: "Boissons",
          badge: "forte-demande",
          negotiable: false,
        },
        {
          id: "rp2",
          name: "Riz local 25kg",
          priceLabel: "12 800 FCFA",
          availability: "limited",
          category: "Alimentation",
          badge: "stock limité",
          promoLabel: "-5% partenaires",
        },
      ]),
    },
    {
      supplierId: partners[1]!.id,
      supplierType: partners[1]!.partnerType,
      visibilityMode: "PARTNER_APPROVED",
      relationshipLevel: partners[1]!.relationshipLevel,
      territory: ["Bouaké"],
      products: products([
        {
          id: "rp3",
          name: "Huile 1L",
          priceLabel: "1 150 FCFA",
          availability: "available",
          category: "Épicerie",
          negotiable: true,
        },
      ]),
    },
    {
      supplierId: "sponsored-corridor",
      supplierType: isTerrain ? "grossiste B" : "Producteur",
      visibilityMode: "SPONSORED_DISCOVERY",
      relationshipLevel: "CONTACT_DISCOVERED",
      sponsored: true,
      territory: ["Corridor sud"],
      products: products([
        {
          id: "rp-s1",
          name: "Farine premium 50kg",
          priceLabel: "18 500 FCFA",
          availability: "available",
          category: "Corridor",
          badge: "sponsorisé",
        },
      ]),
    },
    {
      supplierId: partners[2]!.id,
      supplierType: partners[2]!.partnerType,
      visibilityMode: "HIDDEN",
      relationshipLevel: "NONE",
      products: products([
        {
          id: "hidden-1",
          name: "Produit interdit",
          priceLabel: "0 FCFA",
          availability: "unavailable",
          category: "—",
        },
      ]),
    },
  ];

  const visible = filterVisibleCatalogs(catalogs, flags, actorRole);
  const activePartner = partners.find((p) => p.relationshipLevel === "ACTIVE") ?? partners[0]!;
  const visiblePartners = partners.filter((p) => p.relationshipLevel !== "NONE");

  const sponsoredCatalog = visible.find((c) => c.supplierId === "sponsored-corridor");
  if (sponsoredCatalog && !visiblePartners.some((p) => p.id === sponsoredCatalog.supplierId)) {
    visiblePartners.push({
      id: sponsoredCatalog.supplierId,
      displayName: isTerrain ? "Fournisseur corridor" : "Producteur corridor",
      secondaryName: "Suggestion selon activité · Sponsorisation légère",
      partnerType: sponsoredCatalog.supplierType,
      city: "Corridor sud",
      relationshipLevel: "CONTACT_DISCOVERED",
    });
  }

  return {
    partners: visiblePartners,
    catalogs: visible,
    discoveries: [
      {
        id: "disc-1",
        label: "Nouveau fournisseur corridor",
        hint: "Produit sponsorisé disponible dans votre corridor.",
        supplierId: "sponsored-corridor",
        sponsored: true,
      },
      {
        id: "disc-2",
        label: "Activité similaire",
        hint: "Extension réseau partenaire — boissons Abidjan.",
        sponsored: false,
      },
    ],
    context: {
      activePartnerName: activePartner.displayName,
      relationshipLabel:
        activePartner.relationshipLevel === "ACTIVE" ? "Relation validée" : "Partenaire approuvé",
      recentOrdersLabel: "2 commandes cette semaine",
      corridor: isTerrain ? "Adjamé · corridor sud" : "Abidjan → Bouaké",
      activityLabel: isTerrain ? "Boissons · détail" : "Distribution formelle",
      settlementLabel: "Règlement mobile récent",
      networkAvailability: "Réseau actif aujourd'hui",
    },
  };
}
