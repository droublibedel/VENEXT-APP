import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { EconomicSignalSource, EconomicSignalType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type RadarImpact = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

@Injectable()
export class StrategicSignalsRadarService {
  constructor(private readonly prisma: PrismaService) {}

  async radar(organizationId: string) {
    const internalRows = await this.prisma.economicSignal.findMany({
      where: { organizationId, source: { not: EconomicSignalSource.EXTERNAL_CONTEXT } },
      orderBy: { createdAt: "desc" },
      take: 180,
    });

    const internal = internalRows.map((s) => {
      const metaObj = asRecord(s.metadata);
      return {
        id: s.id,
        domain: "INTERNAL" as const,
        signalType: s.signalType,
        source: s.source,
        intensity: s.intensityScore,
        zoneCode: s.zoneCode,
        createdAt: s.createdAt.toISOString(),
        impact: this.impactFromIntensity(s.intensityScore, s.signalType),
        confidence: this.confidenceFromSource(s.source, s.intensityScore),
        businessImpact: this.interpretBusinessImpact(s.signalType, s.intensityScore),
        affectedTerritories: s.zoneCode ? [s.zoneCode] : this.territoryFromMetadata(metaObj),
        affectedCategories: this.categoriesFromMetadata(metaObj),
        whyItMatters: this.whyInternal(s.signalType, s.intensityScore),
      };
    });

    const externalDb = await this.prisma.economicSignal.findMany({
      where: { organizationId, source: EconomicSignalSource.EXTERNAL_CONTEXT },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    const fromDatabase = externalDb.map((s) => this.mapDbExternalSignal(s));
    const stubs = this.buildExternalContextLayer(organizationId);
    const external = [...fromDatabase, ...stubs];
    const correlated = this.correlate(internal, external);

    return {
      generatedAt: new Date().toISOString(),
      internal,
      external,
      correlation: correlated,
      sourcesLegend: {
        internal:
          "orders, product movement, negotiations, relationships, sponsored traction, messages, cart pressure, group demand (economic_signals excluding EXTERNAL_CONTEXT).",
        external:
          "Persisted EXTERNAL_CONTEXT rows from DB + deterministic calendar/climate/traffic stubs when sparse — never disguised as internal orders.",
      },
    };
  }

  private mapDbExternalSignal(s: {
    id: string;
    signalType: EconomicSignalType;
    source: EconomicSignalSource;
    intensityScore: number;
    zoneCode: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }) {
    const metaObj = asRecord(s.metadata);
    const kind = (metaObj.kind as string) || "DB_EXTERNAL_CONTEXT";
    return {
      id: s.id,
      domain: "EXTERNAL" as const,
      kind,
      label: (metaObj.label as string) || `${kind} · ${s.signalType}`,
      source: s.source,
      impact: this.impactFromIntensity(s.intensityScore, s.signalType),
      confidence: this.confidenceFromSource(s.source, s.intensityScore),
      businessImpact: this.interpretBusinessImpact(s.signalType, s.intensityScore),
      affectedTerritories: s.zoneCode ? [s.zoneCode] : this.territoryFromMetadata(metaObj),
      affectedCategories: this.categoriesFromMetadata(metaObj),
      whyItMatters:
        "Persisted external-context connector row — correlates with internal fabric without ERP attribution.",
      createdAt: s.createdAt.toISOString(),
    };
  }

  private impactFromIntensity(intensity: number, type: EconomicSignalType): RadarImpact {
    const t = type === EconomicSignalType.STOCK_TENSION || type === EconomicSignalType.DEMAND_RISE ? 1.12 : 1;
    const v = intensity * t;
    if (v >= 0.86) return "CRITICAL";
    if (v >= 0.65) return "HIGH";
    if (v >= 0.42) return "MODERATE";
    return "LOW";
  }

  private confidenceFromSource(source: EconomicSignalSource, intensity: number): number {
    const base = source === EconomicSignalSource.EXTERNAL_CONTEXT ? 0.58 : 0.72;
    return Number(Math.min(0.95, base + intensity * 0.2).toFixed(3));
  }

  private interpretBusinessImpact(type: EconomicSignalType, intensity: number): string {
    if (type === EconomicSignalType.DEMAND_RISE) return `Absorption risk rising — plan allocation shifts (I≈${intensity.toFixed(2)}).`;
    if (type === EconomicSignalType.STOCK_TENSION) return "Inventory stress may translate to missed fills in tight corridors.";
    if (type === EconomicSignalType.NEGOTIATION_ACTIVITY) return "Price/term friction could slow order conversion.";
    if (type === EconomicSignalType.NETWORK_EXPANSION) return "Graph motion — opportunity to lock preferred edges early.";
    return "Operational signal — cross-check with wholesale behaviour and territory mix.";
  }

  private categoriesFromMetadata(meta: Record<string, unknown>): string[] {
    const m = meta as { categories?: string[]; category?: string };
    if (Array.isArray(m?.categories)) return m.categories;
    if (m?.category) return [m.category];
    return [];
  }

  private territoryFromMetadata(meta: Record<string, unknown>): string[] {
    const m = meta as { territory?: string; city?: string };
    if (m?.territory) return [m.territory];
    if (m?.city) return [m.city];
    return [];
  }

  private whyInternal(type: EconomicSignalType, intensity: number): string {
    return `Type ${type} at intensity ${intensity.toFixed(2)} modulates fill-rate and negotiation drag in the closed commerce graph — not a generic KPI.`;
  }

  private buildExternalContextLayer(organizationId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const isRamadanSeason = month === 3 || month === 4;
    const weatherFront = now.getDate() % 9 < 3 ? "HARMATTAN_DUST" : "COASTAL_HUMIDITY";

    return [
      {
        id: `ext-weather-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "WEATHER",
        label: `Weather / climate driver (${weatherFront})`,
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: "MODERATE" as RadarImpact,
        confidence: 0.66,
        businessImpact: "Field logistics and cold-chain stress — align wholesale push with shelf reality.",
        affectedTerritories: ["SN/Dakar", "SN/Thiès"],
        affectedCategories: ["Beverage", "Dairy"],
        whyItMatters: "External climate layer is explicit — not blended into 'mysterious' internal demand.",
      },
      {
        id: `ext-ramadan-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "CALENDAR_RAMADAN",
        label: isRamadanSeason ? "Ramadan demand window (active)" : "Ramadan off-cycle (planning)",
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: isRamadanSeason ? ("HIGH" as RadarImpact) : ("LOW" as RadarImpact),
        confidence: 0.74,
        businessImpact: "Shifts daypart demand and basket composition for retail edges — plan sponsorship carefully.",
        affectedTerritories: ["SN", "ML"],
        affectedCategories: ["Staples", "Sweets"],
        whyItMatters: "Calendar signal is declared external — prevents false attribution to sales vanity metrics.",
      },
      {
        id: `ext-holiday-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "PUBLIC_HOLIDAY_DENSITY",
        label: "Public holiday cluster (regional calendar)",
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: "LOW" as RadarImpact,
        confidence: 0.61,
        businessImpact: "Shortens effective delivery windows — expect message/negotiation spikes pre-holiday.",
        affectedTerritories: ["SN"],
        affectedCategories: ["All"],
        whyItMatters: "Holiday density is an interpretable external constraint, not a hidden API.",
      },
      {
        id: `ext-traffic-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "URBAN_TRAFFIC",
        label: "Corridor traffic / last-mile latency (stub)",
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: "MODERATE" as RadarImpact,
        confidence: 0.55,
        businessImpact: "Shifts promise times for retailer fulfillment — may elevate negotiation activity.",
        affectedTerritories: ["SN/Dakar ring"],
        affectedCategories: ["Fresh"],
        whyItMatters: "Labeled stub — real integration would replace connector, not duplicate graph engine.",
      },
      {
        id: `ext-geo-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "GEOPOLITICAL_STABILITY",
        label: "Geopolitical / border friction index (stub)",
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: "LOW" as RadarImpact,
        confidence: 0.5,
        businessImpact: "May delay cross-border replenishment for categories with import concentration.",
        affectedTerritories: ["WASBAN"],
        affectedCategories: ["Import-dependent"],
        whyItMatters: "Strategic risk is explicit; not conflated with your order table.",
      },
      {
        id: `ext-trend-${organizationId.slice(0, 8)}`,
        domain: "EXTERNAL" as const,
        kind: "INTERNET_TREND",
        label: "Search / social demand proxy (stub)",
        source: EconomicSignalSource.EXTERNAL_CONTEXT,
        impact: "MODERATE" as RadarImpact,
        confidence: 0.52,
        businessImpact: "Early category inflection — useful to cross-check with internal signal density.",
        affectedTerritories: ["Youth urban"],
        affectedCategories: ["Ready-to-serve"],
        whyItMatters: "Kept as weak-signal context — not a chatbot answer.",
      },
    ];
  }

  private correlate(
    internal: { signalType: EconomicSignalType; impact: RadarImpact; zoneCode: string | null; id: string }[],
    external: { kind: string; impact: RadarImpact; affectedTerritories: string[] }[],
  ) {
    const pairs: { internalId: string; externalKind: string; thesis: string; jointSeverity: RadarImpact }[] = [];
    const highInt = internal.filter((i) => i.impact === "HIGH" || i.impact === "CRITICAL");
    for (const e of external) {
      if (e.impact === "LOW" && highInt.length === 0) continue;
      const jointSeverity: RadarImpact =
        e.impact === "HIGH" || highInt.length > 2 ? "HIGH" : e.impact === "MODERATE" ? "MODERATE" : "LOW";
      pairs.push({
        internalId: highInt[0]?.id ?? internal[0]?.id ?? "n/a",
        externalKind: e.kind,
        thesis: `Correlates ${e.kind} with internal ${highInt[0]?.signalType ?? "network"} activity — check allocation + field comms, not head-office vanity metrics.`,
        jointSeverity,
      });
    }
    return pairs.slice(0, 12);
  }
}

function asRecord(j: Prisma.JsonValue): Record<string, unknown> {
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
}
