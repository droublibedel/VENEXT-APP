import { getEnterpriseChannel } from "./enterprise-governance-storage";
import {
  assertGrossisteASeparation,
  compareActorPoleAccess,
} from "./grossiste-a-producer-separation";
import type { EnterpriseCommercialChannel, EnterpriseSecureInvitation } from "./enterprise-governance.types";
import { normalizeGrossisteAPoleKey } from "./grossiste-a-canonical-poles";
import { rejectUnknownPoleCreation } from "./venext-canonical-poles";

export class EnterprisePoleIncompatibleError extends Error {
  constructor(message = "ENTERPRISE_POLE_INCOMPATIBLE") {
    super(message);
    this.name = "EnterprisePoleIncompatibleError";
  }
}

/** Vérifie pôle compatible avec acteur entreprise (20.86-C + 20.86-D). */
export function assertEnterprisePoleCompatibility(
  actorKind: "producteur" | "grossiste_a",
  poleId: string,
  enterpriseId?: string,
): void {
  const grossisteBusinessPole =
    actorKind === "grossiste_a" ? normalizeGrossisteAPoleKey(poleId) : null;

  if (!grossisteBusinessPole) {
    rejectUnknownPoleCreation(poleId);
  }

  if (actorKind === "grossiste_a") {
    assertGrossisteASeparation("GROSSISTE_A", grossisteBusinessPole ?? poleId);
    const channel = enterpriseId ? getEnterpriseChannel(enterpriseId) : undefined;
    if (channel && channel.actorKind !== "grossiste_a") {
      throw new EnterprisePoleIncompatibleError();
    }
    const cmp = compareActorPoleAccess("GROSSISTE_A", grossisteBusinessPole ?? poleId);
    if (!cmp.allowed) throw new EnterprisePoleIncompatibleError(cmp.userMessage);
    return;
  }

  const cmp = compareActorPoleAccess("PRODUCER", poleId);
  if (!cmp.allowed) throw new EnterprisePoleIncompatibleError();
}

export function assertInvitationActorConsistency(
  invitation: EnterpriseSecureInvitation,
  channel: EnterpriseCommercialChannel,
): void {
  if (invitation.enterpriseId !== channel.enterpriseId) {
    throw new Error("INVITATION_WRONG_ENTERPRISE");
  }
  assertEnterprisePoleCompatibility(channel.actorKind, invitation.poleId, channel.enterpriseId);
}

export function filterPolesForActorKind(
  actorKind: "producteur" | "grossiste_a",
  poleIds: string[],
): string[] {
  return poleIds.filter((poleId) => {
    try {
      assertEnterprisePoleCompatibility(actorKind, poleId);
      return true;
    } catch {
      return false;
    }
  });
}
