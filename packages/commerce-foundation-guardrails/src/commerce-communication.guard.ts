import type { CommerceActorRole } from "./commerce-foundation-philosophy.guard";
import { resolveCommerceActorKind } from "./commerce-foundation-philosophy.guard";

export type CommerceCommunicationChannel = "professional-mail" | "commerce-messaging";

const SOCIAL_MESSAGING_DRIFT =
  /\b(story|feed|like|follower|réaction|communauté|groupe public|whatsapp clone|chatbot|présence en ligne)\b/i;

export function resolveCommunicationChannel(
  role: CommerceActorRole,
): CommerceCommunicationChannel {
  return resolveCommerceActorKind(role) === "formal" ? "professional-mail" : "commerce-messaging";
}

export function assertCommunicationNotSocial(label: string): boolean {
  return !SOCIAL_MESSAGING_DRIFT.test(label);
}

export function assertFormalUsesMailNotSocialFeed(role: CommerceActorRole, uiTestId: string): boolean {
  if (resolveCommerceActorKind(role) !== "formal") return true;
  return !uiTestId.includes("social-feed") && !uiTestId.includes("community-chat");
}

export function assertTerrainUsesMessagingNotMailWizard(role: CommerceActorRole, uiTestId: string): boolean {
  if (resolveCommerceActorKind(role) !== "terrain") return true;
  return !uiTestId.includes("mail-compose-wizard");
}

export function communicationSeparationHint(role: CommerceActorRole): string {
  return resolveCommunicationChannel(role) === "professional-mail"
    ? "Mail professionnel partenaire"
    : "Communication commerce rapide";
}
