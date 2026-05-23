import { Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

const REL_KEYS = [
  "sponsored_products_enabled",
  "relationship_graph_enabled",
  "contact_sync_enabled",
  "qr_relationship_enabled",
  "commercial_identity_enabled",
] as const;

/** Thin wrapper — all resolution via {@link CanonicalFeatureFlagEvaluator} (Instruction 9B). */
@Injectable()
export class RelationalFlagsService {
  constructor(private readonly flags: CanonicalFeatureFlagEvaluator) {}

  async isEnabled(key: (typeof REL_KEYS)[number], organizationId?: string) {
    return this.flags.isEnabled(key, { organizationId });
  }

  async snapshot(organizationId?: string) {
    const out: Record<string, boolean> = {};
    for (const k of REL_KEYS) {
      out[k] = await this.isEnabled(k, organizationId);
    }
    return out;
  }
}
