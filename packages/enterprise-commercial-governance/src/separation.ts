/**
 * Barrel officiel — séparation Producteur / Grossiste A (Instruction 20.86-E2).
 * Import public : `enterprise-commercial-governance/separation`
 */
export {
  assertGrossisteASeparation,
  compareActorPoleAccess,
  grossisteASeparationUserMessage,
  isGrossisteADashboardMetricAllowed,
  listGrossisteAAuthorizedPoles,
  rejectGrossisteAOnProducerApiRoute,
  rejectProducerOnlyPoleAccess,
} from "./grossiste-a-producer-separation";
export type { CommerceActorKind, PoleAccessComparison } from "./grossiste-a-producer-separation";
