import { z } from "zod";

/** Instruction 15 — edge / offline / telemetry readiness (no GPS payloads). */
export const RouteTelemetryIngestionSchema = z.object({
  status: z.enum(["NOT_CONFIGURED", "READY_FOR_INGEST"]),
  note: z.string(),
});
export type RouteTelemetryIngestion = z.infer<typeof RouteTelemetryIngestionSchema>;

export const EdgeLogisticsSyncReadinessSchema = z.object({
  desktopEdgeSync: z.literal("PLANNED"),
  offlineRouteSync: z.literal("PLANNED"),
  intermittentConnectivityMode: z.literal("SUPPORTED_VIA_ADAPTIVE_UI"),
  localRouteCacheSchemaVersion: z.number().int().nonnegative(),
  routeTelemetry: RouteTelemetryIngestionSchema,
});
export type EdgeLogisticsSyncReadiness = z.infer<typeof EdgeLogisticsSyncReadinessSchema>;

export const SupplyLogisticsPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type SupplyLogisticsPolicy = z.infer<typeof SupplyLogisticsPolicySchema>;

export const LogisticsMovementStripSchema = z.object({
  id: z.string(),
  band: z.string(),
  tension: z.number(),
  vector: z.enum(["compress", "expand", "lateral", "pulse"]),
  label: z.string(),
});
export type LogisticsMovementStrip = z.infer<typeof LogisticsMovementStripSchema>;

/** Instruction 15A — ingestion-ready edge / telemetry placeholders (no live GPS). */
export const RouteTelemetryIngestEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  status: z.enum(["NOT_CONFIGURED", "READY_FOR_INGEST"]),
  allowedPayloadKinds: z.array(z.enum(["GPS_POINT_BATCH", "CORRIDOR_DWELL", "HUB_DOCK_EVENT"])),
  note: z.string(),
});
export type RouteTelemetryIngestEnvelope = z.infer<typeof RouteTelemetryIngestEnvelopeSchema>;

export const EdgeSyncShipmentCacheContractSchema = z.object({
  schemaVersion: z.literal(1),
  maxCachedShipments: z.number().int().positive(),
  evictionPolicy: z.enum(["LRU", "PRIORITY_SCORE"]),
  note: z.string(),
});
export type EdgeSyncShipmentCacheContract = z.infer<typeof EdgeSyncShipmentCacheContractSchema>;

export const OfflineRouteEventQueueContractSchema = z.object({
  schemaVersion: z.literal(1),
  maxQueuedEvents: z.number().int().positive(),
  durable: z.boolean(),
  note: z.string(),
});
export type OfflineRouteEventQueueContract = z.infer<typeof OfflineRouteEventQueueContractSchema>;

export const FutureGpsUpdatePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  trackingMode: z.literal("GPS_FUTURE"),
  /** Placeholder — real payloads would carry WGS84 + accuracy + capturedAt. */
  payloadShape: z.literal("DEFERRED"),
  note: z.string(),
});
export type FutureGpsUpdatePayload = z.infer<typeof FutureGpsUpdatePayloadSchema>;

export const LogisticsEdgeFoundationPackSchema = z.object({
  routeTelemetryIngest: RouteTelemetryIngestEnvelopeSchema,
  edgeSyncShipmentCache: EdgeSyncShipmentCacheContractSchema,
  offlineRouteEventQueue: OfflineRouteEventQueueContractSchema,
  futureGpsUpdatePayload: FutureGpsUpdatePayloadSchema,
});
export type LogisticsEdgeFoundationPack = z.infer<typeof LogisticsEdgeFoundationPackSchema>;

export const SupplyOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  activeShipments: z.number().int().nonnegative(),
  delayedShipments: z.number().int().nonnegative(),
  unstableTerritories: z.number().int().nonnegative(),
  routeCongestionIndex: z.number().min(0).max(1),
  warehousePressureIndex: z.number().min(0).max(1),
  loadingDelayIndex: z.number().min(0).max(1),
  fulfillmentConfidence: z.number().min(0).max(1),
  downstreamSupplyQuality: z.number().min(0).max(1),
  territoryInstability: z.number().min(0).max(1),
  routeExecutionConfidence: z.number().min(0).max(1),
  movementStrips: z.array(LogisticsMovementStripSchema),
  edgeReadiness: EdgeLogisticsSyncReadinessSchema,
  logisticsEdgeFoundation: LogisticsEdgeFoundationPackSchema.optional(),
  activeShipmentProxySemantics: z.string().optional(),
  engineNote: z.string().optional(),
});
export type SupplyOverviewResponse = z.infer<typeof SupplyOverviewResponseSchema>;

export const TerritoryFlowCellSchema = z.object({
  territoryKey: z.string(),
  label: z.string(),
  flowPressure: z.number().min(0).max(1),
  collapseRisk: z.number().min(0).max(1),
  burstHint: z.enum(["steady", "surge", "weak_supply", "overload"]),
  drivers: z.array(z.string()),
});
export type TerritoryFlowCell = z.infer<typeof TerritoryFlowCellSchema>;

export const TerritoryFlowResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  cells: z.array(TerritoryFlowCellSchema),
  overloadedTerritories: z.array(z.string()),
  weakSupplyTerritories: z.array(z.string()),
  moduleNote: z.string().optional(),
});
export type TerritoryFlowResponse = z.infer<typeof TerritoryFlowResponseSchema>;

export const ShipmentMovementSourceSchema = z.enum(["ORDERS_AS_SHIPMENT_PROXY", "SHIPMENT_TABLE"]);
export type ShipmentMovementSource = z.infer<typeof ShipmentMovementSourceSchema>;

export const ShipmentHealthRowSchema = z.object({
  orderId: z.string().uuid(),
  shipmentId: z.string().uuid().optional(),
  corridorKey: z.string(),
  deliveryStatus: z.string(),
  healthScore: z.number().min(0).max(1),
  delayProbability: z.number().min(0).max(1),
  deliveryConfidence: z.number().min(0).max(1),
  fulfillmentQuality: z.number().min(0).max(1),
  territoryStability: z.number().min(0).max(1),
  routeInstabilityHint: z.number().min(0).max(1),
  executionHealth: z.enum(["healthy", "watch", "unstable", "blocked", "suspicious"]),
  movementSource: ShipmentMovementSourceSchema,
  partialFulfillment: z.boolean(),
  suspiciousBehavior: z.boolean(),
  healthDegraded: z.boolean(),
  ageHours: z.number(),
});
export type ShipmentHealthRow = z.infer<typeof ShipmentHealthRowSchema>;

export const ShipmentHealthResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  healthyCount: z.number().int().nonnegative(),
  delayedCount: z.number().int().nonnegative(),
  unstableCount: z.number().int().nonnegative(),
  blockedCount: z.number().int().nonnegative(),
  suspiciousCount: z.number().int().nonnegative(),
  rows: z.array(ShipmentHealthRowSchema),
  moduleNote: z.string().optional(),
});
export type ShipmentHealthResponse = z.infer<typeof ShipmentHealthResponseSchema>;

export const DeliveryRouteRowSchema = z.object({
  corridorKey: z.string(),
  label: z.string(),
  loadFactor: z.number().min(0).max(1),
  instability: z.number().min(0).max(1),
  delayCorridor: z.boolean(),
  bottleneck: z.boolean(),
  activeShipments: z.number().int().nonnegative(),
  recurringFailureHint: z.number().min(0).max(1),
});
export type DeliveryRouteRow = z.infer<typeof DeliveryRouteRowSchema>;

export const DeliveryRouteIntelligenceResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  overloadedRoutes: z.array(z.string()),
  congestionClusters: z.number().int().nonnegative(),
  rows: z.array(DeliveryRouteRowSchema),
  telemetryNote: z.string(),
  moduleNote: z.string().optional(),
});
export type DeliveryRouteIntelligenceResponse = z.infer<typeof DeliveryRouteIntelligenceResponseSchema>;

export const HubPressureSourceSchema = z.enum(["SHIPMENT_TABLE", "ORDER_PROXY", "EDGE_SYNC_FUTURE"]);
export type HubPressureSource = z.infer<typeof HubPressureSourceSchema>;

export const WarehousePressureRowSchema = z.object({
  hubKey: z.string(),
  hubCode: z.string(),
  territory: z.string(),
  label: z.string(),
  source: HubPressureSourceSchema,
  queuePressure: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  saturation: z.number().min(0).max(1),
  dispatchBottleneck: z.number().min(0).max(1),
  queueInstability: z.number().min(0).max(1),
  inventoryPressure: z.number().min(0).max(1),
  openDispatchCount: z.number().int().nonnegative(),
});
export type WarehousePressureRow = z.infer<typeof WarehousePressureRowSchema>;

export const WarehousePressureResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  overloadedHubs: z.array(z.string()),
  rows: z.array(WarehousePressureRowSchema),
  moduleNote: z.string().optional(),
});
export type WarehousePressureResponse = z.infer<typeof WarehousePressureResponseSchema>;

export const LoadingSupervisionRowSchema = z.object({
  orderId: z.string().uuid(),
  kind: z.enum(["loading", "unloading", "dispatch_queue"]),
  waitPressure: z.number().min(0).max(1),
  handlingAnomalyScore: z.number().min(0).max(1),
  label: z.string(),
});
export type LoadingSupervisionRow = z.infer<typeof LoadingSupervisionRowSchema>;

export const LoadingSupervisionResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  loadingDelayCount: z.number().int().nonnegative(),
  unloadingInstabilityCount: z.number().int().nonnegative(),
  queueCongestionScore: z.number().min(0).max(1),
  rows: z.array(LoadingSupervisionRowSchema),
  moduleNote: z.string().optional(),
});
export type LoadingSupervisionResponse = z.infer<typeof LoadingSupervisionResponseSchema>;

export const DelayCongestionRadarResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  recurringDelayScore: z.number().min(0).max(1),
  congestionEscalation: z.number().min(0).max(1),
  routeInstability: z.number().min(0).max(1),
  territoryCollapseRisk: z.number().min(0).max(1),
  abnormalLatencyIndex: z.number().min(0).max(1),
  hotspots: z.array(z.object({ key: z.string(), label: z.string(), intensity: z.number() })),
  moduleNote: z.string().optional(),
});
export type DelayCongestionRadarResponse = z.infer<typeof DelayCongestionRadarResponseSchema>;

export const FulfillmentStabilityMatrixResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  stabilityScore: z.number().min(0).max(1),
  executionVariance: z.number().min(0).max(1),
  downstreamCoherence: z.number().min(0).max(1),
  bands: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      score: z.number(),
      vector: z.enum(["stable", "drift", "rupture"]),
    }),
  ),
  moduleNote: z.string().optional(),
});
export type FulfillmentStabilityMatrixResponse = z.infer<typeof FulfillmentStabilityMatrixResponseSchema>;

export const SupplyRiskMatrixRowSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "watch", "elevated", "critical"]),
  affectedTerritories: z.array(z.string()),
  probableCause: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  relatedSignals: z.array(z.string()),
});
export type SupplyRiskMatrixRow = z.infer<typeof SupplyRiskMatrixRowSchema>;

export const SupplyRiskMatrixResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: SupplyLogisticsPolicySchema,
  rows: z.array(SupplyRiskMatrixRowSchema),
});
export type SupplyRiskMatrixResponse = z.infer<typeof SupplyRiskMatrixResponseSchema>;

export const SupplyLogisticsBriefingResponseSchema = z.object({
  provider: z.literal("MockAIProvider"),
  policy: SupplyLogisticsPolicySchema,
  title: z.string().optional(),
  executiveSummary: z.string().optional(),
  anomalies: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  dataSources: z.array(z.string()).optional(),
  tone: z.literal("logistics_command").optional(),
  note: z.string().optional(),
});
export type SupplyLogisticsBriefingResponse = z.infer<typeof SupplyLogisticsBriefingResponseSchema>;

export const SupplyInterventionRankingBasisSchema = z.object({
  urgencyScore: z.number(),
  impactScore: z.number(),
  confidenceScore: z.number(),
  signalStrengthScore: z.number(),
  territoryFactor: z.number(),
  finalScore: z.number(),
});
export type SupplyInterventionRankingBasis = z.infer<typeof SupplyInterventionRankingBasisSchema>;

export const SupplyInterventionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  expectedImpact: z.string(),
  confidence: z.number(),
  relatedSignals: z.array(z.string()),
  affectedTerritories: z.array(z.string()),
  rankingBasis: SupplyInterventionRankingBasisSchema.optional(),
  finalScore: z.number().optional(),
});
export type SupplyIntervention = z.infer<typeof SupplyInterventionSchema>;

export const SupplyInterventionsResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  interventions: z.array(SupplyInterventionSchema),
});
export type SupplyInterventionsResponse = z.infer<typeof SupplyInterventionsResponseSchema>;

export const SupplyLogisticsBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: SupplyOverviewResponseSchema,
  territoryFlow: TerritoryFlowResponseSchema,
  shipmentHealth: ShipmentHealthResponseSchema,
  routes: DeliveryRouteIntelligenceResponseSchema,
  warehousePressure: WarehousePressureResponseSchema,
  loadingSupervision: LoadingSupervisionResponseSchema,
  delayRadar: DelayCongestionRadarResponseSchema,
  fulfillmentStability: FulfillmentStabilityMatrixResponseSchema,
  riskMatrix: SupplyRiskMatrixResponseSchema,
  briefing: SupplyLogisticsBriefingResponseSchema,
  interventions: SupplyInterventionsResponseSchema,
});
export type SupplyLogisticsBundleResponse = z.infer<typeof SupplyLogisticsBundleResponseSchema>;
