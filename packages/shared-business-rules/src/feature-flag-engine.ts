import type {
  FeatureFlagDimension,
  VenextFeatureKey,
} from "@venext/shared-types";

export interface FlagRule {
  featureKey: VenextFeatureKey;
  enabled: boolean;
  /** Narrowest scope this rule applies to */
  scope: FeatureFlagDimension;
  priority: number;
}

export interface FlagEvaluationContext {
  /** All dimensions that apply to the principal (union of global, geo, org, roles, user) */
  dimensions: FeatureFlagDimension[];
}

/**
 * Stacked remote rules: higher priority wins among matching scopes.
 */
export function evaluateFeatureFlag(
  rules: FlagRule[],
  featureKey: VenextFeatureKey,
  ctx: FlagEvaluationContext,
): boolean {
  const matching = rules
    .filter((r) => r.featureKey === featureKey)
    .filter((r) => ctx.dimensions.some((d) => dimensionEquals(d, r.scope)))
    .sort((a, b) => b.priority - a.priority);

  return matching[0]?.enabled ?? false;
}

function dimensionEquals(
  a: FeatureFlagDimension,
  b: FeatureFlagDimension,
): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "global":
      return b.type === "global";
    case "country":
      return b.type === "country" && a.iso3166 === b.iso3166;
    case "region":
      return b.type === "region" && a.code === b.code;
    case "role_facet":
      return b.type === "role_facet" && a.facet === b.facet;
    case "company":
      return (
        b.type === "company" && a.organizationId === b.organizationId
      );
    case "user":
      return b.type === "user" && a.userId === b.userId;
    default:
      return false;
  }
}
