import type { CommerceErrorKey } from "./commerce-humanized-errors.types";

/** Messages FR de référence (Instruction 20.84-A). */
export const COMMERCE_ERROR_CATALOG_FR: Record<CommerceErrorKey, { title: string; message: string }> = {
  network_unstable: {
    title: "Connexion instable",
    message: "La connexion semble instable. Vérifiez votre internet puis réessayez.",
  },
  connection_timeout: {
    title: "Délai dépassé",
    message: "La réponse met plus de temps que prévu. Réessayez dans un instant.",
  },
  session_expired: {
    title: "Session terminée",
    message: "Reconnectez-vous pour continuer votre activité en toute sécurité.",
  },
  access_suspended: {
    title: "Accès temporairement suspendu",
    message: "Votre accès est en pause. Contactez votre partenaire si besoin.",
  },
  access_denied: {
    title: "Accès réservé",
    message: "Cette action est réservée à votre relation commerciale active.",
  },
  relation_inactive: {
    title: "Relation non active",
    message: "Cette relation n’est plus active pour le moment.",
  },
  wallet_locked: {
    title: "Espace sécurisé",
    message: "Confirmez votre accès pour continuer sur vos règlements.",
  },
  otp_invalid: {
    title: "Code incorrect",
    message: "Le code saisi ne correspond pas. Vérifiez et réessayez.",
  },
  password_incorrect: {
    title: "Accès non confirmé",
    message: "Les informations saisies ne correspondent pas. Réessayez calmement.",
  },
  load_failed: {
    title: "Chargement interrompu",
    message: "Les informations n’ont pas pu être chargées. Réessayez.",
  },
  service_unavailable: {
    title: "Service momentanément indisponible",
    message: "Le service rencontre un léger problème momentanément. Réessayez plus tard.",
  },
  catalog_unavailable: {
    title: "Catalogue indisponible",
    message: "Ce catalogue n’est pas disponible dans ce contexte pour le moment.",
  },
  message_not_sent: {
    title: "Message non envoyé",
    message: "Votre message n’a pas pu partir. Vérifiez la connexion puis réessayez.",
  },
  delivery_unavailable: {
    title: "Livraison indisponible",
    message: "Le suivi livraison n’est pas accessible pour le moment.",
  },
  invalid_file: {
    title: "Fichier non accepté",
    message: "Ce fichier ne peut pas être utilisé ici. Choisissez un autre fichier.",
  },
  image_error: {
    title: "Image non chargée",
    message: "L’image n’a pas pu être affichée. Réessayez ou choisissez une autre image.",
  },
  sync_failed: {
    title: "Synchronisation en attente",
    message: "La synchronisation n’a pas abouti. Elle reprendra dès que la connexion sera stable.",
  },
  cache_error: {
    title: "Données locales",
    message: "Les données locales ont été réinitialisées pour votre sécurité.",
  },
  not_found: {
    title: "Information indisponible",
    message: "Cette information n’est pas disponible pour le moment.",
  },
  server_error: {
    title: "Service momentanément indisponible",
    message: "Un léger problème temporaire est survenu. Réessayez dans quelques instants.",
  },
  runtime_error: {
    title: "Action interrompue",
    message: "Une action n’a pas pu être terminée correctement. Réessayez.",
  },
  unexpected: {
    title: "Petit contretemps",
    message: "Un imprévu est survenu. Rien n’est perdu — vous pouvez réessayer.",
  },
  offline: {
    title: "Hors connexion",
    message: "Cette action nécessite une connexion internet stable.",
  },
  wallet_action_failed: {
    title: "Action non finalisée",
    message: "Cette action n’a pas pu être finalisée pour le moment.",
  },
  order_unavailable: {
    title: "Commande indisponible",
    message: "Cette commande n’est pas accessible dans ce contexte.",
  },
  generic: {
    title: "Action indisponible",
    message: "Cette action n’est pas disponible pour le moment. Réessayez.",
  },
};
