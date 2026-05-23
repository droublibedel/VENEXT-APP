/**
 * Instruction 20.23 — deterministic sector intelligence thresholds.
 */
import { Injectable } from "@nestjs/common";
import { CommercialCorridorState, OrganizationCategory, RelationalSectorType } from "@prisma/client";

@Injectable()
export class RelationalSectorPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  maxPropagationDepth(): number {
    const raw = Number(process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH ?? 8);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, Math.floor(raw)));
  }

  canMutateSectorState(corridorState: CommercialCorridorState): boolean {
    return corridorState !== CommercialCorridorState.TERMINATED;
  }

  slugify(label: string): string {
    const s = label
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toUpperCase();
    return (s.slice(0, 48) || "SECTOR").replace(/-+/g, "-");
  }

  sectorTypeFromCategory(category: OrganizationCategory): RelationalSectorType {
    switch (category) {
      case OrganizationCategory.PRODUCER:
        return RelationalSectorType.PRIMARY_INDUSTRY;
      case OrganizationCategory.WHOLESALER_A:
      case OrganizationCategory.WHOLESALER_B:
        return RelationalSectorType.DISTRIBUTION_LOGISTICS;
      case OrganizationCategory.RETAILER:
        return RelationalSectorType.SERVICES;
      case OrganizationCategory.INTERNAL_ADMIN:
        return RelationalSectorType.UNKNOWN;
      default:
        return RelationalSectorType.UNKNOWN;
    }
  }
}
