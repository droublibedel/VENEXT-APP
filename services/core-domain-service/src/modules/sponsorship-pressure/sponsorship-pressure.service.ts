import { Injectable } from "@nestjs/common";
import { OrganizationCategory } from "@prisma/client";
import type { SponsorshipPressureObservatoryResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import { RelationalFlagsService } from "../relational-commerce/relational-flags.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";

export type SponsoredInjectionListSnapshot = Awaited<ReturnType<SponsoredInjectionEngineService["listActiveInjections"]>>;

@Injectable()
export class SponsorshipPressureService {
  constructor(
    private readonly sponsored: SponsoredInjectionEngineService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly relationalFlags: RelationalFlagsService,
  ) {}

  async fromContext(
    ctx: CommercialNetworkContext,
    snapshot?: SponsoredInjectionListSnapshot | null,
  ): Promise<SponsorshipPressureObservatoryResponse> {
    const orgId = ctx.organizationId;
    const [poleOn, subOn] = await Promise.all([
      this.flags.isEnabled("marketing_activation_enabled", { organizationId: orgId }),
      this.flags.isEnabled("sponsorship_pressure_enabled", { organizationId: orgId }),
    ]);
    if (!poleOn || !subOn) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
        note: "marketing_activation_enabled and sponsorship_pressure_required for this observatory.",
      };
    }
    const [sponsoredProductsOn, obsOn] = await Promise.all([
      this.relationalFlags.isEnabled("sponsored_products_enabled", orgId),
      this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId: orgId }),
    ]);
    if (!sponsoredProductsOn || !obsOn) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
        note: "Sponsored lane governance — sponsored_products_enabled and sponsorship_observatory_enabled required.",
      };
    }

    const list = snapshot ?? (await this.sponsored.listActiveInjections({
      viewerOrganizationId: orgId,
      limit: 120,
      projection: "summary",
    }));
    const n = list.items.length;
    const territoryKeys = new Set(list.items.map((i) => `${i.sponsor.country ?? "?"}/${i.sponsor.city ?? "?"}`));
    const productKeys = new Set(list.items.map((i) => i.product.id));
    const overexposureIndex = Math.min(1, n / 28);
    const concentrationRisk = Math.min(1, n > 0 ? 1 - territoryKeys.size / Math.max(1, n * 0.35) : 0);
    const efficiencyIndex = Number(Math.min(1, 0.5 + (territoryKeys.size / Math.max(8, n)) * 0.35 - overexposureIndex * 0.15).toFixed(3));
    const territorySaturation = Number(Math.min(1, overexposureIndex * 0.85 + concentrationRisk * 0.25).toFixed(3));
    const retailerAttraction = Number(
      Math.min(
        1,
        ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER).length /
          Math.max(6, n + 6),
      ).toFixed(3),
    );
    const sponsorshipDecay = Number((overexposureIndex > 0.65 ? 0.55 : 0.18 + (1 - efficiencyIndex) * 0.4).toFixed(3));

    const signals: SponsorshipPressureObservatoryResponse["signals"] = [];
    if (overexposureIndex > 0.7) {
      signals.push({
        code: "OVEREXPOSURE",
        severity: "elevated",
        headline: "Sponsorship lane density hot",
        detail: "Injection count vs corridor breadth implies trust-surface overload — cool selective depth.",
      });
    }
    if (efficiencyIndex < 0.45) {
      signals.push({
        code: "WEAK_EFFICIENCY",
        severity: "watch",
        headline: "Efficiency drag",
        detail: "Sponsor spread thin relative to injection mass — consolidate territory-native waves.",
      });
    }
    if (concentrationRisk > 0.55) {
      signals.push({
        code: "CONCENTRATION",
        severity: "watch",
        headline: "Concentration risk",
        detail: "Sponsor gravity clustering on few geo keys — diversify stimulation geometry.",
      });
    }

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      policy: "ACTIVE",
      engineReuse: "SponsoredInjectionEngineService",
      overexposureIndex: Number(overexposureIndex.toFixed(3)),
      efficiencyIndex,
      territorySaturation,
      risingSponsoredProducts: productKeys.size,
      sponsorshipDecay,
      retailerAttraction,
      concentrationRisk: Number(concentrationRisk.toFixed(3)),
      signals,
    };
  }
}
