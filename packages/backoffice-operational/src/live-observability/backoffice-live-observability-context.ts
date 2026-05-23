export type LiveObservabilityApplication =
  | "mobile-grossiste-b"
  | "mobile-detaillant"
  | "web-grossiste-a"
  | "web-industrial-nextjs"
  | "backoffice-web";

export type LiveOperationalContext = {
  eventId?: string;
  app: LiveObservabilityApplication;
  platform?: string;
  actorRole?: string;
  partnerRole?: string;
  enterpriseId?: string;
  relationshipId?: string;
  route?: string;
  screen?: string;
  feature?: string;
  module?: string;
  pole?: string;
  action?: string;
  journeyId?: string;
  severity?: string;
  status?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  commercialContext?: Record<string, unknown>;
  networkState?: "online" | "offline" | "degraded";
  networkQuality?: "good" | "fair" | "poor" | "offline" | "unknown";
  offlineState?: boolean;
  offlineMode?: boolean;
  deviceType?: "mobile" | "desktop" | "tablet";
  deviceClass?: "low" | "mid" | "high" | "unknown";
  retryCount?: number;
  language?: string;
  userId?: string;
  userPhone?: string;
  actorId?: string;
  timestamp?: string;
  appVersion?: string;
  buildNumber?: string;
  releaseChannel?: string;
};

type ContextProvider = () => Partial<LiveOperationalContext>;

let application: LiveObservabilityApplication = "mobile-grossiste-b";
let contextProvider: ContextProvider = () => ({});

export function configureLiveObservabilityContext(input: {
  application: LiveObservabilityApplication;
  getContext?: ContextProvider;
}): void {
  application = input.application;
  if (input.getContext) contextProvider = input.getContext;
}

export function resolveLiveOperationalContext(
  partial: Partial<LiveOperationalContext> = {},
): LiveOperationalContext {
  const base = contextProvider();
  const networkState =
    partial.networkState ??
    base.networkState ??
    (typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "online");

  return {
    app: partial.app ?? base.app ?? application,
    actorRole: partial.actorRole ?? base.actorRole,
    partnerRole: partial.partnerRole ?? base.partnerRole,
    enterpriseId: partial.enterpriseId ?? base.enterpriseId,
    relationshipId: partial.relationshipId ?? base.relationshipId,
    route: partial.route ?? base.route ?? (typeof location !== "undefined" ? location.pathname : undefined),
    screen: partial.screen ?? base.screen,
    feature: partial.feature ?? base.feature,
    module: partial.module ?? base.module,
    pole: partial.pole ?? base.pole,
    networkState,
    offlineState: partial.offlineState ?? base.offlineState ?? networkState === "offline",
    deviceType:
      partial.deviceType ??
      base.deviceType ??
      (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"),
    language: partial.language ?? base.language ?? "fr-CI",
    userId: partial.userId ?? base.userId,
    userPhone: partial.userPhone ?? base.userPhone,
    actorId: partial.actorId ?? base.actorId,
    timestamp: partial.timestamp ?? new Date().toISOString(),
  };
}
