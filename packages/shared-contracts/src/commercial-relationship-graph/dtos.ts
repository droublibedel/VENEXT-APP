import { z } from "zod";

const unit = z.number().min(0).max(1);

export const CommercialRelationshipGraphProjectionModeSchema = z.enum(["summary", "full"]);
export type CommercialRelationshipGraphProjectionMode = z.infer<
  typeof CommercialRelationshipGraphProjectionModeSchema
>;

export const CommercialRelationshipNodeRoleSchema = z.enum([
  "PRODUCER",
  "INDUSTRIAL_PRODUCER",
  "WHOLESALER_A",
  "WHOLESALER_B",
  "RETAILER",
  "DISTRIBUTOR_BRIDGE",
  "ISOLATED_NODE",
  "STRATEGIC_HUB",
  /** Instruction 19.1A — category/actor combination not mapped to a distribution role (no silent WHOLESALER_B). */
  "UNKNOWN_COMMERCIAL_ROLE",
]);
export type CommercialRelationshipNodeRole = z.infer<typeof CommercialRelationshipNodeRoleSchema>;

export const CommercialRelationshipEdgeTypeSchema = z.enum([
  "SUPPLIER_RELATION",
  "DISTRIBUTION_RELATION",
  "RETAIL_RELATION",
  "STRATEGIC_RELATION",
  "FRAGILE_RELATION",
  "DORMANT_RELATION",
  "HIGH_DEPENDENCY_RELATION",
  "EXPANSION_RELATION",
]);
export type CommercialRelationshipEdgeType = z.infer<typeof CommercialRelationshipEdgeTypeSchema>;

export const CommercialRelationshipSignalTypeSchema = z.enum([
  "relationship_activity_signal",
  "dependency_pressure_signal",
  "network_fragility_signal",
  "dormant_network_signal",
  "expansion_opportunity_signal",
  /** Instruction 19.1A — pending invitations / non-validated edges preview (never conflated with expansion_opportunity_signal). */
  "pending_relationship_signal",
  "concentration_warning_signal",
  "coverage_gap_signal",
  "bridge_overload_signal",
]);
export type CommercialRelationshipSignalType = z.infer<typeof CommercialRelationshipSignalTypeSchema>;

export const CommercialDependencyClusterTypeSchema = z.enum([
  "WHOLESALER_CONCENTRATION",
  "PRODUCER_DEPENDENCY",
  "RETAILER_SINGLE_SOURCE",
  "BRIDGE_OVERLOAD",
  "FRAGILE_ZONE",
  "DORMANT_CLUSTER",
]);
export type CommercialDependencyClusterType = z.infer<typeof CommercialDependencyClusterTypeSchema>;

export const CommercialBridgeTypeSchema = z.enum([
  "WHOLESALER_BRIDGE",
  "STRATEGIC_DISTRIBUTOR",
  "MULTI_TERRITORY_CONNECTOR",
  "HIGH_FAN_IN_BRIDGE",
  "PRODUCER_RETAIL_INDIRECT",
]);
export type CommercialBridgeType = z.infer<typeof CommercialBridgeTypeSchema>;

export const CommercialRelationshipChainTypeSchema = z.enum([
  "UPSTREAM_CHAIN",
  "DOWNSTREAM_CHAIN",
  "PRODUCER_TO_RETAILER",
  "FRAGILE_CHAIN",
  "DORMANT_CHAIN",
  "EXPANSION_CHAIN",
]);
export type CommercialRelationshipChainType = z.infer<typeof CommercialRelationshipChainTypeSchema>;

export const CommercialRelationshipGraphOverviewSchema = z.object({
  headline: z.string().max(480),
  acceptedRelationshipCount: z.number().int().min(0),
  partnerOrganizationCount: z.number().int().min(0),
  producerNeighborCount: z.number().int().min(0),
  wholesalerNeighborCount: z.number().int().min(0),
  retailerNeighborCount: z.number().int().min(0),
  pendingRelationshipCount: z.number().int().min(0),
  concentrationIndex: unit,
  coverageIndex: unit,
  fragilityIndex: unit,
  overviewExplanation: z.string().max(960),
});
export type CommercialRelationshipGraphOverview = z.infer<typeof CommercialRelationshipGraphOverviewSchema>;

export const CommercialRelationshipNodeSchema = z.object({
  organizationId: z.string().uuid(),
  commercialId: z.string().max(16),
  displayName: z.string().max(200),
  category: z.string().max(32),
  actorType: z.string().max(32),
  territory: z.string().max(160),
  verificationStatus: z.string().max(32),
  nodeRole: CommercialRelationshipNodeRoleSchema,
  activityState: z.enum(["ACTIVE", "QUIESCENT", "DORMANT"]),
  relationshipCount: z.number().int().min(0),
  upstreamCount: z.number().int().min(0),
  downstreamCount: z.number().int().min(0),
  commercialWeight: unit,
  sourceSignals: z.array(z.string()).max(24),
});
export type CommercialRelationshipNode = z.infer<typeof CommercialRelationshipNodeSchema>;

export const CommercialRelationshipEdgeSchema = z.object({
  relationshipId: z.string().uuid(),
  upstreamOrganizationId: z.string().uuid(),
  downstreamOrganizationId: z.string().uuid(),
  relationshipType: CommercialRelationshipEdgeTypeSchema,
  status: z.string().max(24),
  source: z.string().max(40),
  relationshipStrength: unit,
  relationshipStability: unit,
  dependencyLevel: unit,
  commercialIntensity: unit,
  activityState: z.enum(["ACTIVE", "QUIESCENT", "DORMANT"]),
  visibilityScope: z.literal("RELATIONSHIP_ONLY"),
  sourceSignals: z.array(z.string()).max(24),
  explanation: z.string().max(720),
  /** Instruction 19.1A — bounded pair counts (Negotiation has no relationshipId; matched by buyer/seller org pair). */
  negotiationPairCount: z.number().int().min(0).default(0),
  supportingReservationIntentCount: z.number().int().min(0).default(0),
  supportingShipmentCount: z.number().int().min(0).default(0),
  supportingGroupBuyingSessionCount: z.number().int().min(0).default(0),
  supportingProductVisibilityCount: z.number().int().min(0).default(0),
});
export type CommercialRelationshipEdge = z.infer<typeof CommercialRelationshipEdgeSchema>;

export const CommercialRelationshipSignalSchema = z.object({
  signalId: z.string().max(64),
  signalType: CommercialRelationshipSignalTypeSchema,
  affectedNodes: z.array(z.string().uuid()).max(48),
  affectedEdges: z.array(z.string().uuid()).max(48),
  affectedTerritories: z.array(z.string().max(120)).max(32),
  severity: z.enum(["info", "low", "medium", "high"]),
  confidence: unit,
  confidenceExplanation: z.string().max(480),
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type CommercialRelationshipSignal = z.infer<typeof CommercialRelationshipSignalSchema>;

export const CommercialDependencyClusterSchema = z.object({
  clusterId: z.string().max(64),
  clusterType: CommercialDependencyClusterTypeSchema,
  involvedOrganizations: z.array(z.string().uuid()).max(48),
  involvedRelationships: z.array(z.string().uuid()).max(48),
  dependencyScore: unit,
  fragilityScore: unit,
  affectedTerritories: z.array(z.string().max(120)).max(24),
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type CommercialDependencyCluster = z.infer<typeof CommercialDependencyClusterSchema>;

export const CommercialCoverageCellSchema = z.object({
  cellId: z.string().max(64),
  territoryLabel: z.string().max(160),
  relationshipDensity: unit,
  distributionCoverage: unit,
  upstreamCoverage: unit,
  downstreamCoverage: unit,
  isolatedArea: z.boolean(),
  coverageGap: z.boolean(),
  explanation: z.string().max(480),
});
export type CommercialCoverageCell = z.infer<typeof CommercialCoverageCellSchema>;

export const CommercialCoverageModelSchema = z.object({
  version: z.literal("1"),
  symbolicProjection: z.literal(true),
  territories: z.array(z.string().max(160)).max(48),
  relationshipDensity: unit,
  distributionCoverage: unit,
  upstreamCoverage: unit,
  downstreamCoverage: unit,
  isolatedAreas: z.array(z.string().max(160)).max(32),
  coverageGaps: z.array(z.string().max(160)).max(32),
  cells: z.array(CommercialCoverageCellSchema).max(64),
  coverageExplanation: z.string().max(960),
});
export type CommercialCoverageModel = z.infer<typeof CommercialCoverageModelSchema>;

export const CommercialBridgeSchema = z.object({
  bridgeId: z.string().max(64),
  organizationId: z.string().uuid(),
  bridgeType: CommercialBridgeTypeSchema,
  connectedTerritories: z.array(z.string().max(160)).max(24),
  upstreamLinks: z.number().int().min(0),
  downstreamLinks: z.number().int().min(0),
  bridgeLoad: unit,
  overloadRisk: unit,
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type CommercialBridge = z.infer<typeof CommercialBridgeSchema>;

export const CommercialRelationshipChainSchema = z.object({
  chainId: z.string().max(64),
  chainType: CommercialRelationshipChainTypeSchema,
  nodes: z.array(z.string().uuid()).max(16),
  edges: z.array(z.string().uuid()).max(16),
  chainStrength: unit,
  chainFragility: unit,
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type CommercialRelationshipChain = z.infer<typeof CommercialRelationshipChainSchema>;

/** Full taxonomy for diagnostics (emitted vs unavailable). */
export const COMMERCIAL_DEPENDENCY_CLUSTER_TYPES_ALL: CommercialDependencyClusterType[] = [
  "WHOLESALER_CONCENTRATION",
  "PRODUCER_DEPENDENCY",
  "RETAILER_SINGLE_SOURCE",
  "BRIDGE_OVERLOAD",
  "FRAGILE_ZONE",
  "DORMANT_CLUSTER",
];

export const COMMERCIAL_RELATIONSHIP_CHAIN_TYPES_ALL: CommercialRelationshipChainType[] = [
  "UPSTREAM_CHAIN",
  "DOWNSTREAM_CHAIN",
  "PRODUCER_TO_RETAILER",
  "FRAGILE_CHAIN",
  "DORMANT_CHAIN",
  "EXPANSION_CHAIN",
];

export function commercialClusterUnavailableTypes(
  emitted: CommercialDependencyClusterType[],
): CommercialDependencyClusterType[] {
  const s = new Set(emitted);
  return COMMERCIAL_DEPENDENCY_CLUSTER_TYPES_ALL.filter((t) => !s.has(t));
}

export function commercialChainUnavailableTypes(emitted: CommercialRelationshipChainType[]): CommercialRelationshipChainType[] {
  const s = new Set(emitted);
  return COMMERCIAL_RELATIONSHIP_CHAIN_TYPES_ALL.filter((t) => !s.has(t));
}

export const CommercialRelationshipGraphViewerScopeSchema = z.enum([
  "INDUSTRIAL_PRODUCER_VIEW",
  "WHOLESALER_VIEW",
  "RETAILER_VIEW",
  "ADMIN_VIEW",
]);
export type CommercialRelationshipGraphViewerScope = z.infer<typeof CommercialRelationshipGraphViewerScopeSchema>;

export const CommercialRelationshipDiagnosticsSchema = z.object({
  relationshipSource: z.literal("PRISMA_RELATIONSHIP_TABLE"),
  graphMode: z.literal("RELATIONSHIP_GRAPH"),
  openMarketplace: z.literal(false),
  socialNetworkMode: z.literal(false),
  symbolicProjection: z.literal(true),
  advisoryOnly: z.literal(true),
  payloadProjection: CommercialRelationshipGraphProjectionModeSchema,
  sourceBundlesEmbedded: z.boolean(),
  payloadWeightClass: z.enum(["compact", "large"]),
  composeCacheHit: z.boolean(),
  cacheStrategy: z.literal("SHORT_TTL_GRAPH_CACHE_WITH_SINGLE_FLIGHT"),
  costDisclosure: z.string().max(720),
  validatedEdgesOnly: z.boolean(),
  pendingEdgePreviewIncluded: z.boolean(),
  coverageModelEnabled: z.boolean(),
  chainsModelEnabled: z.boolean(),
  /** Instruction 19.1A — HTTP viewer scope (enforcement still producer-only by default). */
  viewerScope: CommercialRelationshipGraphViewerScopeSchema,
  /** Prisma take caps for ego slice / internal expansion (honest truncation flags). */
  nodesLimit: z.number().int().min(0),
  edgesLimit: z.number().int().min(0),
  nodesTruncated: z.boolean(),
  edgesTruncated: z.boolean(),
  paginationSupported: z.literal(false),
  /** Prisma tables / heuristics consulted for this materialization. */
  dataSourcesUsed: z.array(z.string()).max(32),
  emittedClusterTypes: z.array(CommercialDependencyClusterTypeSchema).max(16),
  unavailableClusterTypes: z.array(CommercialDependencyClusterTypeSchema).max(16),
  emittedChainTypes: z.array(CommercialRelationshipChainTypeSchema).max(16),
  unavailableChainTypes: z.array(CommercialRelationshipChainTypeSchema).max(16),
  /** Summary projection: chain payloads stripped from HTTP body; diagnostics below reflect visible payload. */
  summaryProjectionOmitsChains: z.boolean().optional(),
  /** Summary projection: cluster list capped (12) for compact payloads. */
  summaryProjectionClustersCapped: z.boolean().optional(),
});
export type CommercialRelationshipDiagnostics = z.infer<typeof CommercialRelationshipDiagnosticsSchema>;

export const CommercialRelationshipGraphSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: CommercialRelationshipGraphOverviewSchema,
  nodes: z.array(CommercialRelationshipNodeSchema).max(256),
  edges: z.array(CommercialRelationshipEdgeSchema).max(400),
  signals: z.array(CommercialRelationshipSignalSchema).max(64),
  clusters: z.array(CommercialDependencyClusterSchema).max(48),
  coverage: CommercialCoverageModelSchema,
  bridges: z.array(CommercialBridgeSchema).max(48),
  chains: z.array(CommercialRelationshipChainSchema).max(64),
  diagnostics: CommercialRelationshipDiagnosticsSchema,
});
export type CommercialRelationshipGraphSnapshot = z.infer<typeof CommercialRelationshipGraphSnapshotSchema>;

export const CommercialRelationshipGraphBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  disclaimer: z.string().max(960),
  snapshot: CommercialRelationshipGraphSnapshotSchema,
});
export type CommercialRelationshipGraphBundle = z.infer<typeof CommercialRelationshipGraphBundleSchema>;
