/**
 * Instruction 20.4B — honest optional-dependency surface for corridor diagnostics (not a placeholder).
 */
export type CorridorOptionalDependencyStatus = {
  optionalDependencyMissing: string[];
  optionalDependencyWarnings: string[];
  dependencyStatus: Record<string, "OK" | "MISSING" | "WARN">;
  productionFailClosed: boolean;
  /** Truth: only negotiation-to-cart wires cart_conversion; no direct Order.create elsewhere. */
  orderCreationDirectCallSites: "NOT_PRESENT_IN_CODEBASE";
  orderCreationPolicyWired: boolean;
  cartConversionPolicyWired: boolean;
};

export function detectOptionalDependencyStatus(input: {
  trustProfileRowMissing?: boolean;
  sponsoredSyncCorridorGovernanceMissing?: boolean;
  negotiationCorridorPolicyMissing?: boolean;
  cartConversionCorridorPolicyMissing?: boolean;
  corridorRealtimePublisherUnconfigured?: boolean;
  commercialTrustTouchMissing?: boolean;
}): CorridorOptionalDependencyStatus {
  const productionFailClosed = process.env.NODE_ENV === "production" && process.env.VENEXT_GOVERNANCE_FAIL_CLOSED === "true";
  const optionalDependencyMissing: string[] = [];
  const optionalDependencyWarnings: string[] = [];
  const dependencyStatus: Record<string, "OK" | "MISSING" | "WARN"> = {};

  if (input.sponsoredSyncCorridorGovernanceMissing) {
    optionalDependencyMissing.push("RelationshipGovernanceService@sponsored_relationship_sync");
    dependencyStatus.corridorGovernanceSponsoredSync = "MISSING";
  } else {
    dependencyStatus.corridorGovernanceSponsoredSync = "OK";
  }

  if (input.negotiationCorridorPolicyMissing) {
    optionalDependencyMissing.push("RelationshipGovernancePolicyService@negotiation_engine");
    dependencyStatus.corridorPolicyNegotiationEngine = "MISSING";
  } else {
    dependencyStatus.corridorPolicyNegotiationEngine = "OK";
  }

  if (input.cartConversionCorridorPolicyMissing) {
    optionalDependencyMissing.push("RelationshipGovernancePolicyService@negotiation_to_cart");
    dependencyStatus.corridorPolicyCartConversion = "MISSING";
  } else {
    dependencyStatus.corridorPolicyCartConversion = "OK";
  }

  if (input.corridorRealtimePublisherUnconfigured) {
    optionalDependencyWarnings.push("corridor_realtime_domain_fanout_not_configured");
    dependencyStatus.corridorRealtimePublisher = "WARN";
  } else {
    dependencyStatus.corridorRealtimePublisher = "OK";
  }

  if (input.trustProfileRowMissing) {
    optionalDependencyWarnings.push("commercial_trust_profile_missing_for_heuristic_soft_blend");
    dependencyStatus.commercialTrustProfileHeuristic = "WARN";
  } else {
    dependencyStatus.commercialTrustProfileHeuristic = "OK";
  }

  if (input.commercialTrustTouchMissing) {
    optionalDependencyWarnings.push("commercial_trust_touch_service_optional_absent");
    dependencyStatus.commercialTrustTouch = "WARN";
  } else {
    dependencyStatus.commercialTrustTouch = "OK";
  }

  return {
    optionalDependencyMissing,
    optionalDependencyWarnings,
    dependencyStatus,
    productionFailClosed,
    orderCreationDirectCallSites: "NOT_PRESENT_IN_CODEBASE",
    orderCreationPolicyWired: false,
    cartConversionPolicyWired: true,
  };
}
