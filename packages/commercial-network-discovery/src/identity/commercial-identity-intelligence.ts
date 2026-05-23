import type { DisplayIdentityMode, RecognitionReason } from "./commercial-identity.types";

const FORBIDDEN_PHRASES = [
  "compatibilité",
  "match algorithmique",
  "ia a trouvé",
  "score",
  "98%",
  "algorithme",
  "entreprise certifiée",
  "kyc",
  "raison sociale",
  "corporate",
];

export function sanitizeCommercialIdentityText(text: string): string {
  let out = text.replace(/\d+%/g, "").trim();
  const lower = out.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      out = out.replace(new RegExp(phrase, "gi"), "");
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

export function buildIdentityRecognitionHints(input: {
  recognitionReason: RecognitionReason;
  displayMode: DisplayIdentityMode;
}): string[] {
  const hints: string[] = [];
  switch (input.recognitionReason) {
    case "CONTACT_MUTUAL_MATCH":
      hints.push("Contact mutuel");
      hints.push("Dans vos contacts");
      break;
    case "CONTACT_ONE_WAY_MATCH":
      hints.push("Dans vos contacts");
      break;
    case "ACTIVITY_MATCH":
      hints.push(
        input.displayMode === "MIXED_DISCOVERY_IDENTITY"
          ? "Suggestion selon activité"
          : "Partenaire commercial probable",
      );
      break;
    case "CITY_MATCH":
      hints.push("Même zone commerciale");
      break;
    case "PRODUCT_INTEREST_MATCH":
      hints.push("Intérêt produit compatible");
      break;
    case "FORMAL_VALIDATED_PARTNER":
      hints.push("Partenaire validé");
      break;
    case "UNKNOWN_CONTACT":
      hints.push("Contact commercial potentiel");
      break;
    default:
      break;
  }
  return hints.map(sanitizeCommercialIdentityText).filter(Boolean);
}

export function buildContactDiscoveryHints(input: {
  contactSyncGranted: boolean;
  localContactsCount: number;
}): string[] {
  if (!input.contactSyncGranted) {
    return ["Activez la synchronisation pour retrouver vos contacts commerciaux."];
  }
  if (input.localContactsCount > 0) {
    return [`${input.localContactsCount} contacts analysés localement — noms conservés sur votre appareil.`];
  }
  return ["Aucun contact local disponible pour le moment."];
}

export function buildTerrainRelationshipHints(input: {
  autoAccept: boolean;
  mutualContact: boolean;
}): string[] {
  const hints: string[] = [];
  if (input.mutualContact) {
    hints.push("Contact reconnu dans votre téléphone");
  }
  if (input.autoAccept) {
    hints.push("Connexion terrain immédiate possible");
  } else {
    hints.push("Profil commercial à vérifier avant connexion");
  }
  return hints.map(sanitizeCommercialIdentityText);
}

export function buildPseudoIdentityHints(displayName?: string): string[] {
  if (!displayName?.trim()) return ["Profil commercial simple"];
  return [sanitizeCommercialIdentityText("Partenaire terrain actif")];
}

export function buildContactFirstIdentitySignals(hasLocalContact: boolean): string[] {
  if (hasLocalContact) return ["Contact reconnu"];
  return [];
}

export function buildTerrainRegistrationHints(): string[] {
  return [
    sanitizeCommercialIdentityText("Inscription en quelques secondes"),
    sanitizeCommercialIdentityText("Pseudo ou nom — boutique optionnelle"),
  ];
}

export function recognitionReasonToBadge(reason: RecognitionReason, mode: DisplayIdentityMode): string {
  if (reason === "CONTACT_MUTUAL_MATCH") return "Contact mutuel";
  if (reason === "CONTACT_ONE_WAY_MATCH") return "Dans vos contacts";
  if (mode === "MIXED_DISCOVERY_IDENTITY" || reason === "ACTIVITY_MATCH") {
    return "Suggestion selon activité";
  }
  if (reason === "FORMAL_VALIDATED_PARTNER") return "Partenaire validé";
  return "Contact commercial potentiel";
}
