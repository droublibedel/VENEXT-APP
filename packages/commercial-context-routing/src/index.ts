export type {
  CommercialContextModule,
  CommercialContextTransitionId,
  CommercialContextReference,
  CommercialContextLinkGraph,
  CommercialNavigationIntent,
  CommercialContextRoutingFlags,
  CommercialContextHistoryEntry,
  CommercialContextStore,
  CommercialContextRouter,
  CommercialContextRoutingInput,
} from "./commercial-context-routing.types";

export {
  isCommercialContextRoutingEnabled,
  isCommercialContextHistoryEnabled,
  isCrossModuleNavigationEnabled,
  createEmptyCommercialContext,
  createCommercialContextStore,
  setActiveCommercialContext,
  pickPrimaryContextKey,
  assertSingleActiveContext,
} from "./commercial-context-routing";

export {
  sanitizeCommercialNavigationLabel,
  resolveCommercialContext,
  resolvePanelForModule,
} from "./commercial-context-resolution";
export type { ResolvedCommercialContext } from "./commercial-context-resolution";

export {
  getTransitionTargetModule,
  navigateCommercialContext,
  assertNavigationNotEnterprise,
} from "./commercial-context-navigation";

export {
  pushCommercialContextHistory,
  buildCommercialContextHistory,
  restorePreviousCommercialContext,
  trimCommercialContextHistory,
} from "./commercial-context-history";
export type { CommercialContextHistorySnapshot } from "./commercial-context-history";

export { createCommercialContextRouter, mergeWithContextRouter } from "./commercial-context-router";

export type { CommercialScreenIntent } from "./commercial-screen-intent";
export { screenIntentFromModule, screenIntentFromNavigationIntent } from "./commercial-screen-intent";

export type {
  GrossisteBTabDestination,
  GrossisteAWorkspaceDestination,
  DetaillantTabDestination,
  ProducerPoleDestination,
  ProducerWorkspaceTabDestination,
  ActorScreenDestination,
  ScreenNavigationPayload,
} from "./commercial-actor-destinations";
export {
  resolveActorScreenDestination,
  destinationUsesMessagingNotMail,
} from "./commercial-actor-destinations";

export {
  isScreenNavigationAllowed,
  inferPartnerRoleFromReference,
} from "./commercial-navigation-governance";

export { buildScreenNavigationPayload, applyScreenIntent } from "./commercial-screen-navigation";

export { createGrossisteBCommercialRouter, grossisteBTabFromReference } from "./createGrossisteBCommercialRouter";
export type { GrossisteBNavigationHandlers } from "./createGrossisteBCommercialRouter";

export {
  createGrossisteACommercialRouter,
  grossisteAWorkspaceFromReference,
} from "./createGrossisteACommercialRouter";
export type { GrossisteANavigationHandlers } from "./createGrossisteACommercialRouter";

export {
  createDetaillantCommercialRouter,
  detaillantTabFromReference,
} from "./createDetaillantCommercialRouter";
export type { DetaillantNavigationHandlers } from "./createDetaillantCommercialRouter";

export {
  createProducerCommercialRouter,
  producerPoleFromReference,
  producerSubTabFromReference,
} from "./createProducerCommercialRouter";
export type { ProducerNavigationHandlers } from "./createProducerCommercialRouter";

export {
  CommercialRouterProvider,
  useCommercialRouter,
  useCommercialRoutingInput,
  useCommercialQuickReturn,
  applyGrossisteBBackNavigation,
  applyGrossisteABackNavigation,
  applyDetaillantBackNavigation,
  applyProducerBackNavigation,
} from "./CommercialRouterProvider";
export type { CommercialRouterContextValue } from "./CommercialRouterProvider";
