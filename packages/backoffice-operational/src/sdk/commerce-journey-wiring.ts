import type { CommerceOperationalApp } from "./commerce-operational-observability.js";
import {
  OPERATIONAL_JOURNEY_EVENTS,
  trackJourneyAbandon,
  trackJourneyComplete,
  trackJourneyFailed,
  trackJourneyStart,
  trackJourneyStep,
} from "./commerce-operational-observability.js";

export type CommerceJourneyWireContext = {
  application: CommerceOperationalApp;
  actorId: string;
  actorRole: string;
  screen: string;
  module: string;
  userId?: string;
  enterpriseId?: string;
};

/** AUTH — login / OTP */
export function wireAuthLoginJourney(ctx: CommerceJourneyWireContext): string {
  const id = trackJourneyStart({ journeyKey: "login", ...ctx });
  trackJourneyStep(id, OPERATIONAL_JOURNEY_EVENTS.AUTH.LOGIN_START, { screen: ctx.screen });
  return id;
}

export function wireAuthOtpStep(journeyId: string, ctx: Pick<CommerceJourneyWireContext, "screen">): void {
  trackJourneyStep(journeyId, OPERATIONAL_JOURNEY_EVENTS.AUTH.OTP_REQUEST, { screen: ctx.screen });
}

export function wireAuthLoginSuccess(journeyId: string, ctx: Pick<CommerceJourneyWireContext, "screen">): void {
  trackJourneyComplete(journeyId, OPERATIONAL_JOURNEY_EVENTS.AUTH.LOGIN_SUCCESS, { screen: ctx.screen });
}

export function wireAuthLoginFailure(
  journeyId: string,
  reason: string,
  ctx: Pick<CommerceJourneyWireContext, "screen">,
): void {
  trackJourneyFailed(journeyId, reason, { screen: ctx.screen, step: OPERATIONAL_JOURNEY_EVENTS.AUTH.LOGIN_FAILURE });
}

/** CATALOGUE — création produit */
export function wireCatalogCreateJourney(ctx: CommerceJourneyWireContext): string {
  const id = trackJourneyStart({ journeyKey: "create_product", ...ctx });
  trackJourneyStep(id, OPERATIONAL_JOURNEY_EVENTS.CATALOG.PRODUCT_CREATE_START, { screen: ctx.screen });
  return id;
}

export function wireCatalogPublishSuccess(journeyId: string, screen: string): void {
  trackJourneyComplete(journeyId, OPERATIONAL_JOURNEY_EVENTS.CATALOG.PRODUCT_PUBLISH, { screen });
}

/** COMMANDE */
export function wireOrderCreateJourney(ctx: CommerceJourneyWireContext): string {
  return trackJourneyStart({ journeyKey: "create_order", ...ctx });
}

export function wireOrderValidate(journeyId: string, screen: string): void {
  trackJourneyComplete(journeyId, OPERATIONAL_JOURNEY_EVENTS.ORDER.VALIDATE, { screen });
}

export function wireOrderReject(journeyId: string, screen: string): void {
  trackJourneyFailed(journeyId, "ORDER_REFUSED", { screen, step: OPERATIONAL_JOURNEY_EVENTS.ORDER.REFUSE });
}

/** WALLET */
export function wireWalletActivationJourney(ctx: CommerceJourneyWireContext): string {
  return trackJourneyStart({ journeyKey: "wallet_activation", ...ctx });
}

export function wireWalletPaymentFailed(journeyId: string, screen: string): void {
  trackJourneyFailed(journeyId, "PAYMENT_FAILED", {
    screen,
    step: OPERATIONAL_JOURNEY_EVENTS.WALLET.PAYMENT_FAILED,
  });
}

/** MESSAGING */
export function wireMessagingConversation(ctx: CommerceJourneyWireContext): string {
  const id = trackJourneyStart({ journeyKey: "send_message", ...ctx });
  trackJourneyStep(id, OPERATIONAL_JOURNEY_EVENTS.MESSAGING.CONVERSATION_OPEN, { screen: ctx.screen });
  return id;
}

export function wireMessageSent(journeyId: string, screen: string): void {
  trackJourneyStep(journeyId, OPERATIONAL_JOURNEY_EVENTS.MESSAGING.MESSAGE_SEND, { screen });
}

/** RÉSEAU partenaires */
export function wirePartnerInviteJourney(ctx: CommerceJourneyWireContext): string {
  return trackJourneyStart({ journeyKey: "partner_network", ...ctx });
}

/** INDUSTRIEL */
export function wireIndustrialDashboard(ctx: CommerceJourneyWireContext): string {
  const id = trackJourneyStart({ journeyKey: "industrial_analytics", ...ctx });
  trackJourneyStep(id, OPERATIONAL_JOURNEY_EVENTS.INDUSTRIAL.POLE_DASHBOARD, { screen: ctx.screen });
  return id;
}

export function wireJourneyAbandonOnUnmount(
  journeyId: string | null,
  screen: string,
  reason = "USER_LEFT",
): void {
  if (journeyId) trackJourneyAbandon(journeyId, reason, { screen });
}
