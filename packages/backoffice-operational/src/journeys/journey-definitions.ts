import type { JourneyDefinition } from "../types/journey.types.js";

export const CANONICAL_JOURNEY_DEFINITIONS: JourneyDefinition[] = [
  {
    journeyKey: "terrain_onboarding",
    labelFr: "Inscription terrain",
    application: "mobile-grossiste-b",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "phone_verified", labelFr: "Téléphone vérifié", order: 1 },
      { stepKey: "profile_completed", labelFr: "Profil complété", order: 2 },
      { stepKey: "completed", labelFr: "Terminée", order: 3 },
    ],
  },
  {
    journeyKey: "login",
    labelFr: "Connexion",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "otp_sent", labelFr: "OTP envoyé", order: 1 },
      { stepKey: "session_open", labelFr: "Session ouverte", order: 2 },
    ],
  },
  {
    journeyKey: "wallet_activation",
    labelFr: "Activation wallet",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "kyc_started", labelFr: "KYC démarré", order: 1 },
      { stepKey: "wallet_active", labelFr: "Wallet activé", order: 2 },
    ],
  },
  {
    journeyKey: "create_product",
    labelFr: "Création produit",
    application: "web-industrial-nextjs",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "draft_saved", labelFr: "Brouillon", order: 1 },
      { stepKey: "published", labelFr: "Publié", order: 2 },
    ],
  },
  {
    journeyKey: "create_order",
    labelFr: "Création commande",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "cart_ready", labelFr: "Panier prêt", order: 1 },
      { stepKey: "order_created", labelFr: "Commande créée", order: 2 },
      { stepKey: "order_validated", labelFr: "Commande validée", order: 3 },
    ],
  },
  {
    journeyKey: "delivery_confirm",
    labelFr: "Confirmation livraison",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "delivery_started", labelFr: "Livraison démarrée", order: 1 },
      { stepKey: "delivery_confirmed", labelFr: "Livraison confirmée", order: 2 },
    ],
  },
  {
    journeyKey: "settlement",
    labelFr: "Règlement",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarré", order: 0 },
      { stepKey: "settlement_initiated", labelFr: "Initié", order: 1 },
      { stepKey: "settlement_confirmed", labelFr: "Confirmé", order: 2 },
    ],
  },
  {
    journeyKey: "enterprise_invitation",
    labelFr: "Invitation entreprise",
    application: "web-grossiste-a",
    steps: [
      { stepKey: "invitation_sent", labelFr: "Invitation envoyée", order: 0 },
      { stepKey: "collaborator_registered", labelFr: "Collaborateur inscrit", order: 1 },
      { stepKey: "account_activated", labelFr: "Compte activé", order: 2 },
    ],
  },
  {
    journeyKey: "pole_activation",
    labelFr: "Activation pôle",
    application: "web-grossiste-a",
    steps: [
      { stepKey: "pole_activated", labelFr: "Pôle activé", order: 0 },
      { stepKey: "first_login", labelFr: "Première connexion", order: 1 },
    ],
  },
  {
    journeyKey: "send_message",
    labelFr: "Envoi message",
    application: "all",
    steps: [
      { stepKey: "message_composed", labelFr: "Message saisi", order: 0 },
      { stepKey: "message_sent", labelFr: "Message envoyé", order: 1 },
    ],
  },
  {
    journeyKey: "reset_password",
    labelFr: "Réinitialisation mot de passe",
    application: "all",
    steps: [
      { stepKey: "started", labelFr: "Démarrée", order: 0 },
      { stepKey: "otp_sent", labelFr: "OTP envoyé", order: 1 },
      { stepKey: "password_updated", labelFr: "Mot de passe mis à jour", order: 2 },
    ],
  },
  {
    journeyKey: "product_publish",
    labelFr: "Publication produit",
    application: "web-industrial-nextjs",
    steps: [
      { stepKey: "form_open", labelFr: "Formulaire", order: 0 },
      { stepKey: "image_uploaded", labelFr: "Image", order: 1 },
      { stepKey: "published", labelFr: "Publié", order: 2 },
    ],
  },
  {
    journeyKey: "partner_network",
    labelFr: "Réseau partenaires",
    application: "all",
    steps: [
      { stepKey: "invitation_sent", labelFr: "Invitation", order: 0 },
      { stepKey: "relation_validated", labelFr: "Validée", order: 1 },
    ],
  },
  {
    journeyKey: "industrial_analytics",
    labelFr: "Analytics industriel",
    application: "web-industrial-nextjs",
    steps: [
      { stepKey: "dashboard_view", labelFr: "Dashboard", order: 0 },
      { stepKey: "report_exported", labelFr: "Export", order: 1 },
    ],
  },
  {
    journeyKey: "backoffice_operator",
    labelFr: "Opérateur back-office",
    application: "backoffice-web",
    steps: [
      { stepKey: "login", labelFr: "Connexion", order: 0 },
      { stepKey: "ticket_open", labelFr: "Ticket", order: 1 },
      { stepKey: "governance_action", labelFr: "Gouvernance", order: 2 },
    ],
  },
];

export function getJourneyDefinition(journeyKey: string): JourneyDefinition | undefined {
  return CANONICAL_JOURNEY_DEFINITIONS.find((j) => j.journeyKey === journeyKey);
}

export function expectedNextStep(journeyKey: string, currentStep: string): string | undefined {
  const def = getJourneyDefinition(journeyKey);
  if (!def) return undefined;
  const ordered = [...def.steps].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((s) => s.stepKey === currentStep);
  if (idx < 0 || idx >= ordered.length - 1) return undefined;
  return ordered[idx + 1]?.stepKey;
}
