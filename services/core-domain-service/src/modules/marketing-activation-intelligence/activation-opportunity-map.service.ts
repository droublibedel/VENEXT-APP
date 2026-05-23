import { Injectable } from "@nestjs/common";
import type {
  ActivationMapModeComputation,
  ActivationOpportunityMapMode,
  ActivationOpportunityMapResponse,
  SeasonalPressure,
} from "@venext/shared-contracts";
import { OrganizationCategory } from "@prisma/client";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

const CONTROLS: ActivationOpportunityMapMode[] = [
  "momentum",
  "dormant",
  "sponsorship",
  "retailer_engagement",
  "territory_stimulation",
  "activation_decay",
];

function norm(n: number, denom: number) {
  return Math.min(1, denom > 0 ? n / denom : n > 0 ? 1 : 0);
}

@Injectable()
export class ActivationOpportunityMapService {
  fromContext(
    ctx: CommercialNetworkContext,
    mode: ActivationOpportunityMapMode,
    snapshot: SponsoredInjectionListSnapshot | null,
    seasonalPressure: SeasonalPressure,
  ): ActivationOpportunityMapResponse {
    const orgId = ctx.organizationId;
    const cpGeo = (id: string) => {
      const c = ctx.partnersPack.counterparties.find((x) => x.id === id);
      return c ? `${c.country ?? "?"}/${c.city ?? "?"}` : "unknown";
    };

    const orderCur = new Map<string, number>();
    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === orgId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const k = cpGeo(other);
      if (k === "unknown") continue;
      orderCur.set(k, (orderCur.get(k) ?? 0) + 1);
    }
    const orderPrev = new Map<string, number>();
    for (const o of ctx.ordersPrev30d) {
      const other = o.buyerOrganizationId === orgId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const k = cpGeo(other);
      if (k === "unknown") continue;
      orderPrev.set(k, (orderPrev.get(k) ?? 0) + 1);
    }

    const sponsorByTerritory = new Map<string, number>();
    if (snapshot) {
      for (const it of snapshot.items) {
        const k = `${it.sponsor.country ?? "?"}/${it.sponsor.city ?? "?"}`;
        sponsorByTerritory.set(k, (sponsorByTerritory.get(k) ?? 0) + 1);
      }
    }

    const retailerDensity = new Map<string, number>();
    for (const c of ctx.partnersPack.counterparties) {
      if (c.category !== OrganizationCategory.RETAILER) continue;
      const k = `${c.country ?? "?"}/${c.city ?? "?"}`;
      retailerDensity.set(k, (retailerDensity.get(k) ?? 0) + 1);
    }

    const maxOrder = Math.max(1, ...orderCur.values(), 1);
    const maxSponsor = Math.max(1, ...sponsorByTerritory.values(), 1);
    const maxRetail = Math.max(1, ...retailerDensity.values(), 1);
    const globalActivity = ctx.orders30d.length + ctx.negotiations30d + ctx.messageThreads30d;

    const keys = new Set<string>([...orderCur.keys(), ...orderPrev.keys(), ...sponsorByTerritory.keys(), ...retailerDensity.keys()]);

    const cells: ActivationOpportunityMapResponse["cells"] = [];
    const primarySignals: string[] =
      mode === "momentum"
        ? ["orders30d", "ordersPrev30d", "acceleration"]
        : mode === "dormant"
          ? ["inverse_order_pulse", "low_activity"]
          : mode === "sponsorship"
            ? ["SponsoredInjectionEngineService.listActiveInjections"]
            : mode === "retailer_engagement"
              ? ["retailer_headcount_geo", "order_touch_density"]
              : mode === "territory_stimulation"
                ? ["sponsorship", "orders", "MOCK_CONTEXT:seasonalPressure", "retailer_density"]
                : ["inverse_orders", "global_neg_message_proxy"];
    const mockContextUsed = mode === "territory_stimulation" && seasonalPressure.source.includes("MOCK_CONTEXT");

    for (const territoryKey of keys) {
      const oc = orderCur.get(territoryKey) ?? 0;
      const op = orderPrev.get(territoryKey) ?? 0;
      const sp = sponsorByTerritory.get(territoryKey) ?? 0;
      const rd = retailerDensity.get(territoryKey) ?? 0;
      const accel = norm(oc - op, op + 2);
      const orderN = norm(oc, maxOrder);
      const sponsorN = norm(sp, maxSponsor);
      const retailN = norm(rd, maxRetail);
      const seasonalHit = seasonalPressure.affectedTerritories.includes(territoryKey);
      const seasonalTerm = seasonalHit ? seasonalPressure.intensity * 0.35 : 0;

      let heat = 0;
      let label = territoryKey.replace("/", " · ");
      let corridor: string | undefined;
      let modeHint: string | undefined;

      if (mode === "momentum") {
        heat = Number(Math.min(1, orderN * 0.55 + accel * 0.45 + (oc > op ? 0.08 : 0)).toFixed(3));
        modeHint = "momentum_v2";
      } else if (mode === "dormant") {
        heat = Number(Math.min(1, (1 - orderN) * 0.75 + (oc < 2 ? 0.2 : 0)).toFixed(3));
        modeHint = "dormant_v2";
      } else if (mode === "sponsorship") {
        heat = Number(sponsorN.toFixed(3));
        corridor = sp > 4 ? "sponsor_pressure_corridor" : undefined;
        modeHint = snapshot ? "sponsorship_injection_density" : "sponsorship_no_snapshot";
      } else if (mode === "retailer_engagement") {
        heat = Number(Math.min(1, retailN * 0.45 + orderN * 0.55).toFixed(3));
        modeHint = "retailer_engagement_v2";
      } else if (mode === "territory_stimulation") {
        heat = Number(
          Math.min(1, orderN * 0.35 + sponsorN * 0.3 + retailN * 0.2 + seasonalTerm).toFixed(3),
        );
        modeHint = "territory_stimulation_v2";
      } else {
        /** activation_decay */
        const globalDecay = norm(globalActivity, 80);
        heat = Number(Math.min(1, Math.max(0.04, 0.92 - orderN * 0.5 - globalDecay * 0.25)).toFixed(3));
        modeHint = "activation_decay_v2";
      }

      const c = ctx.partnersPack.counterparties.find((x) => `${x.country ?? "?"}/${x.city ?? "?"}` === territoryKey);
      label = c ? `${c.city ?? "Zone"}, ${c.country ?? ""}`.trim() : label;

      cells.push({ territoryKey, label, heat, corridor, modeHint });
    }

    cells.sort((a, b) => b.heat - a.heat);

    const modeComputation: ActivationMapModeComputation = {
      mode,
      primarySignals,
      formulaVersion: "13A_MODE_HEAT_V2",
      mockContextUsed,
    };

    const legends: Record<ActivationOpportunityMapMode, string> = {
      momentum: "Momentum — order acceleration vs prior window (per territory).",
      dormant: "Dormant — inverse order pulse / low excitation envelope.",
      sponsorship: "Sponsorship — injection density from sponsored context (engine output, not duplicated).",
      retailer_engagement: "Retailer engagement — geo retailer mass × order touch density.",
      territory_stimulation: "Territory stimulation — orders + sponsor spread + MOCK_CONTEXT seasonal + retailer response.",
      activation_decay: "Activation decay — cooling field vs global negotiation/message activity proxy.",
    };

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      mode,
      legend: legends[mode],
      cells: cells.slice(0, 22),
      controls: CONTROLS,
      mapEngine: "MapControlEngine_layers",
      policy: "ACTIVE",
      modeComputation,
    };
  }

  parseMode(raw?: string): ActivationOpportunityMapMode {
    const m = (raw ?? "momentum") as ActivationOpportunityMapMode;
    return CONTROLS.includes(m) ? m : "momentum";
  }
}
