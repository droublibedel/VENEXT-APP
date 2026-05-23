import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  assertGrossisteASeparation,
  grossisteASeparationUserMessage,
  rejectGrossisteAOnProducerApiRoute,
  compareActorPoleAccess,
} from "enterprise-commercial-governance";

const UX_ROUTE =
  "Cette vue est réservée à la direction industrielle. Votre espace couvre la distribution structurée.";

/** Garde séparation Grossiste A / Producteur (Instruction 20.86-C). */
@Injectable()
export class GrossisteAPoleGuardService {
  assertActorRoute(actorRole: string | undefined, routePath: string): void {
    const role = String(actorRole ?? "");
    try {
      rejectGrossisteAOnProducerApiRoute(role, routePath);
    } catch {
      throw new ForbiddenException({ userMessage: UX_ROUTE });
    }
  }

  assertPoleAccess(actorRole: string | undefined, pole: string | undefined): void {
    if (!pole?.trim()) return;
    const role = String(actorRole ?? "");
    try {
      assertGrossisteASeparation(role, pole);
    } catch (e) {
      const cmp = compareActorPoleAccess(role, pole);
      throw new ForbiddenException({
        userMessage: grossisteASeparationUserMessage(cmp.reasonCode),
      });
    }
  }
}
