import type {
  CommercialCatalogPreviewData,
  CommercialContactSuggestion,
  CommercialDiscoveryView,
} from "./commercial-network-discovery.types";
import { applyTerrainIdentityToView } from "./identity/applyTerrainDisplayIdentity";
import { mockTerrainIdentitySuggestions } from "./identity/commercial-identity-mock-data";

export const MOCK_LOCAL_CONTACTS_COUNT = 42;

export function mockCommercialDiscoveryView(
  actorRole: "grossiste_b" | "detaillant",
): CommercialDiscoveryView {
  const isGrossiste = actorRole === "grossiste_b";
  const suggestions = mockTerrainIdentitySuggestions(actorRole);

  const view: CommercialDiscoveryView = {
    suggestions,
    connected: [
      {
        id: "conn-1",
        displayName: isGrossiste ? "Client Riviera" : "Grossiste Riviera",
        localContactName: isGrossiste ? "Client Riviera" : "Grossiste Riviera",
        registeredBusinessName: isGrossiste ? "Détaillant Riviera" : "Grossiste Riviera Distribution",
        phone: "+2250700000001",
        city: "Abidjan",
        activityType: isGrossiste ? "détaillant" : "grossiste B",
        connectedAt: "Cette semaine",
        availabilityLabel: "Disponible aujourd'hui",
      },
    ],
    contactSyncGranted: true,
    localContactsCount: MOCK_LOCAL_CONTACTS_COUNT,
  };

  return applyTerrainIdentityToView(view, actorRole, {
    commercial_contact_first_identity_enabled: true,
    commercial_activity_based_suggestions_enabled: true,
  });
}

export function mockCatalogPreview(partnerId: string, partnerName: string): CommercialCatalogPreviewData {
  return {
    partnerId,
    partnerName,
    updatedAt: "Aujourd'hui",
    popularLabel: "Produits populaires réseau",
    promotionLabel: "-5% partenaires terrain",
    products: [
      {
        id: "cp1",
        name: "Eau minérale 1.5L x12",
        priceLabel: "4 200 FCFA",
        availability: "available",
        badge: "forte-demande",
      },
      {
        id: "cp2",
        name: "Riz local 25kg",
        priceLabel: "12 800 FCFA",
        availability: "available",
        badge: "rotation",
      },
      {
        id: "cp3",
        name: "Huile 1L",
        priceLabel: "1 150 FCFA",
        availability: "limited",
        badge: "stock limité",
      },
      {
        id: "cp4",
        name: "Farine 50kg",
        priceLabel: "18 500 FCFA",
        availability: "available",
      },
    ],
  };
}

/** Simule la logique contacts mutuels / sens unique (fondation). */
export function rankContactSuggestions(
  suggestions: CommercialContactSuggestion[],
): CommercialContactSuggestion[] {
  const order: Record<CommercialContactSuggestion["matchKind"], number> = {
    mutual: 0,
    activity_boosted: 1,
    one_way: 2,
  };
  return [...suggestions].sort((a, b) => order[a.matchKind] - order[b.matchKind]);
}
