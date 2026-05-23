import type { CommercialContactSuggestion } from "../commercial-network-discovery.types";
import { applyTerrainIdentityToSuggestion } from "./applyTerrainDisplayIdentity";
import { resolveFormalDisplayIdentity } from "./resolveFormalDisplayIdentity";
import { resolveTerrainDisplayIdentity } from "./resolveTerrainDisplayIdentity";

/** Scénario A — détaillant connaît « François », boutique « La Rue de la Mode ». */
export function mockScenarioFrançoisRetailerView(): ReturnType<typeof resolveTerrainDisplayIdentity> {
  return resolveTerrainDisplayIdentity({
    actorId: "terrain-francois",
    actorType: "DETAILLANT",
    phoneNumber: "+2250701020304",
    contactName: "François",
    registeredBusinessName: "La Rue de la Mode",
    activityLabel: "Chaussures",
    city: "Adjamé",
    matchKind: "mutual",
  });
}

/** Scénario B — grossiste connaît « Client Yopougon », détaillant inscrit « Boutique Espoir ». */
export function mockScenarioClientYopougonGrossisteView(): ReturnType<typeof resolveTerrainDisplayIdentity> {
  return resolveTerrainDisplayIdentity({
    actorId: "terrain-client-yop",
    actorType: "GROSSISTE_B",
    phoneNumber: "+2250505060708",
    contactName: "Client Yopougon",
    registeredBusinessName: "Boutique Espoir",
    activityLabel: "Alimentation",
    city: "Yopougon",
    matchKind: "mutual",
  });
}

export function mockScenarioActivityDiscovery(): ReturnType<typeof resolveTerrainDisplayIdentity> {
  return resolveTerrainDisplayIdentity({
    actorId: "terrain-activity",
    actorType: "DETAILLANT",
    phoneNumber: "+2250304050607",
    registeredDisplayName: "Aminata",
    registeredBusinessName: "Maison du Sucre CI",
    activityLabel: "Boissons",
    city: "Abidjan",
    matchKind: "activity_boosted",
    activityDiscovery: true,
  });
}

export function mockScenarioFormalProducer(): ReturnType<typeof resolveFormalDisplayIdentity> {
  return resolveFormalDisplayIdentity({
    actorId: "formal-producer-1",
    actorType: "PRODUCER",
    registeredBusinessName: "AgroNexus CI",
    activityLabel: "Agro-industrie",
    city: "San Pedro",
    validationLabel: "Documents vérifiés",
  });
}

export function mockTerrainIdentitySuggestions(
  actorRole: "grossiste_b" | "detaillant",
): CommercialContactSuggestion[] {
  const isGrossiste = actorRole === "grossiste_b";
  const raw: CommercialContactSuggestion[] = [
    {
      id: "sug-francois",
      phone: "+2250701020304",
      displayName: "La Rue de la Mode",
      localContactName: isGrossiste ? undefined : "François",
      registeredBusinessName: "La Rue de la Mode",
      activityLabel: "Chaussures",
      city: "Adjamé",
      photoInitials: "??",
      matchKind: "mutual",
      partnerStatus: "suggested",
      catalogPreviewCount: 6,
      recentActivity: "Commande hier",
      hasOrders: true,
      sameCorridor: true,
      partnerRoleLabel: isGrossiste ? "Détaillant" : "Grossiste",
      businessAudioId: "mock-ba-francois",
      businessAudioUrl: "https://mock.venext.ci/terrain-audio/mock-ba-francois.webm",
      businessAudioDurationSeconds: 52,
      catalogPreviewImageUrls: [
        "https://mock.venext.ci/catalog/shoe1.jpg",
        "https://mock.venext.ci/catalog/shoe2.jpg",
        "https://mock.venext.ci/catalog/bag1.jpg",
      ],
    },
    {
      id: "sug-sarah",
      phone: "+2250505060708",
      displayName: "Sarah Distribution",
      localContactName: isGrossiste ? "Sarah grossiste" : "Sarah grossiste",
      registeredBusinessName: "Sarah Distribution",
      activityLabel: "Boissons",
      city: "Bouaké",
      photoInitials: "??",
      matchKind: "mutual",
      partnerStatus: "suggested",
      catalogPreviewCount: 4,
    },
    {
      id: "sug-client-yop",
      phone: "+2250102030405",
      displayName: "Boutique Espoir",
      localContactName: isGrossiste ? "Client Yopougon" : undefined,
      registeredBusinessName: "Boutique Espoir",
      registeredPersonalName: isGrossiste ? undefined : "Moussa Traoré",
      activityLabel: isGrossiste ? "Détaillant" : "Alimentation",
      city: "Yopougon",
      photoInitials: "??",
      matchKind: "mutual",
      partnerStatus: "suggested",
      catalogPreviewCount: 8,
    },
    {
      id: "sug-moussa",
      phone: "+2250708091011",
      displayName: "Maison du Sucre",
      localContactName: isGrossiste ? "Moussa sucre" : undefined,
      registeredBusinessName: "Maison du Sucre CI",
      registeredPersonalName: "Moussa Traoré",
      activityLabel: "Alimentation",
      city: "Yopougon",
      photoInitials: "??",
      matchKind: "one_way",
      partnerStatus: "suggested",
      catalogPreviewCount: 3,
    },
    {
      id: "sug-activity",
      phone: "+2250203040506",
      displayName: "Aminata",
      registeredDisplayName: "Aminata",
      registeredBusinessName: "Distribution Boissons Plus",
      activityLabel: "Boissons",
      city: "Abidjan",
      photoInitials: "??",
      matchKind: "activity_boosted",
      partnerStatus: "suggested",
      catalogPreviewCount: 5,
    },
    {
      id: "sug-unknown",
      phone: "+2250700000000",
      displayName: "+2250700000000",
      activityLabel: "Contact commercial potentiel",
      city: "Abidjan",
      photoInitials: "??",
      matchKind: "one_way",
      partnerStatus: "suggested",
      catalogPreviewCount: 0,
    },
  ];

  const role = isGrossiste ? "grossiste_b" : "detaillant";
  return raw.map((s) =>
    applyTerrainIdentityToSuggestion(s, role, {
      commercial_contact_first_identity_enabled: true,
      commercial_activity_based_suggestions_enabled: true,
    }),
  );
}
