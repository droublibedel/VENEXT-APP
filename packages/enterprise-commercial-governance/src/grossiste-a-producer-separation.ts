import {
  GROSSISTE_A_CANONICAL_POLES,
  isGrossisteACanonicalPole,
  isGrossisteAAllowedVenextPoleId,
  isProducerOnlyPole,
  type GrossisteACanonicalPole,
} from "./grossiste-a-canonical-poles";

export type CommerceActorKind = "PRODUCER" | "GROSSISTE_A" | "GROSSISTE_B" | "DETAILLANT";

export type PoleAccessComparison = {
  actor: CommerceActorKind;
  requestedPole: string;
  allowed: boolean;
  ownerActor: CommerceActorKind;
  reasonCode?:
    | "OK"
    | "PRODUCER_ONLY_POLE"
    | "UNKNOWN_POLE"
    | "GROSSISTE_A_SCOPE"
    | "WRONG_ACTOR_ROUTE";
  userMessage?: string;
};

const UX = {
  producerOnly:
    "Cet espace est réservé à la direction industrielle. Votre espace couvre la distribution structurée.",
  wrongRoute:
    "Cette vue n’est pas disponible pour votre rôle de distributeur structuré.",
  unknownPole: "Ce pôle n’existe pas pour votre compte grossiste.",
} as const;

function normalizeActor(raw: string): CommerceActorKind {
  const u = raw.toUpperCase();
  if (u.includes("PRODUCER") || u === "PRODUCTEUR") return "PRODUCER";
  if (u.includes("GROSSISTE_A") || u.includes("GROSSISTE A")) return "GROSSISTE_A";
  if (u.includes("DETAIL")) return "DETAILLANT";
  return "GROSSISTE_B";
}

export function compareActorPoleAccess(
  actorRaw: string,
  requestedPole: string,
): PoleAccessComparison {
  const actor = normalizeActor(actorRaw);
  const pole = requestedPole.trim();

  if (actor === "PRODUCER") {
    if (isProducerOnlyPole(pole) || isGrossisteACanonicalPole(pole)) {
      return { actor, requestedPole: pole, allowed: true, ownerActor: "PRODUCER", reasonCode: "OK" };
    }
    return { actor, requestedPole: pole, allowed: true, ownerActor: "PRODUCER", reasonCode: "OK" };
  }

  if (actor !== "GROSSISTE_A") {
    return {
      actor,
      requestedPole: pole,
      allowed: true,
      ownerActor: actor,
      reasonCode: "OK",
    };
  }

  if (isProducerOnlyPole(pole)) {
    return {
      actor,
      requestedPole: pole,
      allowed: false,
      ownerActor: "PRODUCER",
      reasonCode: "PRODUCER_ONLY_POLE",
      userMessage: UX.producerOnly,
    };
  }

  if (isGrossisteACanonicalPole(pole)) {
    return {
      actor,
      requestedPole: pole,
      allowed: true,
      ownerActor: "GROSSISTE_A",
      reasonCode: "OK",
    };
  }

  if (isGrossisteAAllowedVenextPoleId(pole)) {
    return {
      actor,
      requestedPole: pole,
      allowed: true,
      ownerActor: "GROSSISTE_A",
      reasonCode: "OK",
    };
  }

  return {
    actor,
    requestedPole: pole,
    allowed: false,
    ownerActor: "GROSSISTE_A",
    reasonCode: "UNKNOWN_POLE",
    userMessage: UX.unknownPole,
  };
}

export function rejectProducerOnlyPoleAccess(actorRaw: string, requestedPole: string): void {
  const cmp = compareActorPoleAccess(actorRaw, requestedPole);
  if (!cmp.allowed) {
    const err = new Error(cmp.userMessage ?? "VENEXT_POLE_ACCESS_DENIED");
    (err as Error & { code: string }).code = cmp.reasonCode ?? "POLE_DENIED";
    throw err;
  }
}

export function assertGrossisteASeparation(actorRaw: string, requestedPole: string): void {
  const actor = normalizeActor(actorRaw);
  if (actor !== "GROSSISTE_A") return;
  rejectProducerOnlyPoleAccess(actorRaw, requestedPole);
  const pole = requestedPole.trim();
  if (!isGrossisteACanonicalPole(pole) && !isGrossisteAAllowedVenextPoleId(pole)) {
    rejectProducerOnlyPoleAccess(actorRaw, pole);
  }
}

export function rejectGrossisteAOnProducerApiRoute(actorRaw: string, routePath: string): void {
  const actor = normalizeActor(actorRaw);
  if (actor !== "GROSSISTE_A") return;
  const path = routePath.toLowerCase();
  if (path.includes("/producer/") || path.includes("/commerce-foundation/producer")) {
    const err = new Error(UX.wrongRoute);
    (err as Error & { code: string }).code = "WRONG_ACTOR_ROUTE";
    throw err;
  }
}

export function listGrossisteAAuthorizedPoles(): GrossisteACanonicalPole[] {
  return [...GROSSISTE_A_CANONICAL_POLES];
}

export function isGrossisteADashboardMetricAllowed(metricKey: string): boolean {
  const forbidden = [
    "production",
    "usine",
    "factory",
    "macro",
    "pilotage_industriel",
    "prevision_industrielle",
    "ia_macro",
    "supply_chain_erp",
  ];
  const k = metricKey.toLowerCase();
  return !forbidden.some((f) => k.includes(f));
}

export function grossisteASeparationUserMessage(reasonCode?: string): string {
  if (reasonCode === "PRODUCER_ONLY_POLE") return UX.producerOnly;
  if (reasonCode === "WRONG_ACTOR_ROUTE") return UX.wrongRoute;
  return UX.unknownPole;
}
