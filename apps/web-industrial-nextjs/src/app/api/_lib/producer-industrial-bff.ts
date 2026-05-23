/**
 * Instruction 20.46 — server aggregation for /api/producer-industrial/*
 */

import type { NextRequest } from "next/server";

import {
  fallbackProducerAlerts,
  fallbackProducerCommercialNetwork,
  fallbackProducerDataIntelligence,
  fallbackProducerExecutive,
  fallbackProducerFinanceCollections,
  fallbackProducerMapControl,
  fallbackProducerMarketingActivation,
  fallbackProducerNetworkActivity,
  fallbackProducerOrdersSummary,
  fallbackProducerOverview,
  fallbackProducerPartners,
  fallbackProducerProducts,
  fallbackProducerSupplyLogistics,
  PRODUCER_FALLBACK_ORG_ID,
} from "@/producer-industrial/data/producer-industrial-fallback";
import {
  mapCommercialNetworkBundle,
  mapExecutiveToOverview,
  mapGeoAndSupplyToMap,
  mapMarketingFromProducts,
  mapMonitoringToAlerts,
  mapNetworkActivity,
  mapObservatoryToIntelligence,
  mapOrdersSnapshotSummary,
  mapOrdersSnapshotToFinance,
  mapPartnersFromGraph,
  mapProductsFromSignals,
  mapStrategicObservatoryToExecutive,
  mapSupplyFlowToSupplyDto,
  inferDataSource,
  resolveFinanceBase,
} from "@/producer-industrial/data/producer-industrial-data.mapper";
import { createProducerEnvelope, mergeDataSource } from "@/producer-industrial/data/producer-industrial-data-status";
import type { ProducerIndustrialEnvelope } from "@/producer-industrial/data/producer-industrial-data.types";

import { buildRelationalOrdersUpstreamHeaders } from "./relational-orders-bff";
import { resolveCoreUpstream } from "./proxy-backend";

const DEMO_RELATIONSHIP_ID = "41111111-1111-1111-1111-111111111003";

function resolveOrganizationId(req: NextRequest): string {
  return req.nextUrl.searchParams.get("organizationId")?.trim() || PRODUCER_FALLBACK_ORG_ID;
}

function liveDataFlagEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.PRODUCER_INDUSTRIAL_LIVE_DATA === "true";
}

async function fetchUpstreamJson(
  req: NextRequest,
  path: string,
): Promise<{ ok: boolean; data: Record<string, unknown> | null; status: number }> {
  const base = resolveCoreUpstream();
  if (!base) return { ok: false, data: null, status: 503 };
  const headersOrErr = buildRelationalOrdersUpstreamHeaders(req);
  if (headersOrErr instanceof Response) return { ok: false, data: null, status: 403 };

  const target = `${base}${path.startsWith("/") ? path : `/${path}`}${req.nextUrl.search}`;
  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: headersOrErr,
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    if (!upstream.ok) return { ok: false, data: null, status: upstream.status };
    const data = (await upstream.json()) as Record<string, unknown>;
    return { ok: true, data, status: upstream.status };
  } catch {
    return { ok: false, data: null, status: 502 };
  }
}

function withTiming<T>(
  organizationId: string,
  handler: () => Promise<ProducerIndustrialEnvelope<T>>,
): Promise<ProducerIndustrialEnvelope<T>> {
  const started = Date.now();
  return handler().then((env) => ({
    ...env,
    diagnostics: {
      ...env.diagnostics,
      apiLatencyMs: Date.now() - started,
      lastSuccessfulSyncAt: env.dataSource !== "fallback" ? new Date().toISOString() : env.diagnostics.lastSuccessfulSyncAt ?? null,
    },
  }));
}

export async function handleProducerIndustrialOverview(
  req: NextRequest,
): Promise<ProducerIndustrialEnvelope<import("@/producer-industrial/data/producer-industrial-data.types").ProducerIndustrialOverviewDto>> {
  const exec = await handleProducerIndustrialExecutive(req);
  return createProducerEnvelope({
    organizationId: exec.organizationId,
    dataSource: exec.dataSource,
    fallbackUsed: exec.fallbackUsed,
    fallbackReasons: exec.fallbackReasons,
    diagnostics: exec.diagnostics,
    payload: mapExecutiveToOverview(exec.payload),
  });
}

export async function handleProducerIndustrialExecutive(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerExecutive(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const reasons: string[] = [];
    let live = false;

    const observatory = await fetchUpstreamJson(
      req,
      `/v1/relational-strategic-observatory/strategic-observatory-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    if (observatory.ok && observatory.data) live = true;
    else reasons.push("strategic_observatory_unavailable");

    const synthesis = await fetchUpstreamJson(
      req,
      `/v1/relational-executive-strategic-synthesis/executive-strategic-synthesis-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    if (synthesis.ok && synthesis.data) live = true;
    else reasons.push("executive_synthesis_unavailable");

    const base = fallbackProducerExecutive(organizationId, "partial_upstream").payload;
    const mapped = mapStrategicObservatoryToExecutive(observatory.data, base);
    const dataSource = inferDataSource(live, reasons.length > 0);

    if (!live) return fallbackProducerExecutive(organizationId, reasons.join(";") || "upstream_unavailable");

    return createProducerEnvelope({
      organizationId,
      dataSource,
      fallbackUsed: dataSource !== "live",
      fallbackReasons: reasons,
      diagnostics: { upstreamPaths: ["strategic-observatory", "executive-synthesis"] },
      payload: mapped,
    });
  });
}

export async function handleProducerIndustrialCommercialNetwork(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerCommercialNetwork(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const reasons: string[] = [];
    const bundle = await fetchUpstreamJson(
      req,
      `/v1/commercial-network/bundle?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const orders = await fetchUpstreamJson(
      req,
      `/v1/relational-orders/snapshot?organizationId=${encodeURIComponent(organizationId)}&projection=summary`,
    );

    const commercial = mapCommercialNetworkBundle(bundle.data);
    if (commercial) {
      return createProducerEnvelope({
        organizationId,
        dataSource: orders.ok ? "mixed" : "live",
        fallbackUsed: !orders.ok,
        fallbackReasons: orders.ok ? [] : ["orders_snapshot_unavailable"],
        diagnostics: { upstreamPaths: ["commercial-network", "relational-orders"] },
        payload: commercial,
      });
    }

    if (orders.ok && orders.data) {
      const summary = mapOrdersSnapshotSummary(orders.data);
      const fb = fallbackProducerCommercialNetwork(organizationId, "commercial_bundle_empty").payload;
      if (summary) {
        return createProducerEnvelope({
          organizationId,
          dataSource: "mixed",
          fallbackUsed: true,
          fallbackReasons: ["commercial_bundle_empty"],
          payload: { ...fb, totalOrders7d: summary.totalOrders7d },
        });
      }
    }

    reasons.push("commercial_network_unavailable");
    return fallbackProducerCommercialNetwork(organizationId, reasons.join(";"));
  });
}

export async function handleProducerIndustrialMarketingActivation(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerMarketingActivation(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const bundle = await fetchUpstreamJson(
      req,
      `/v1/commercial-network/bundle?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const products = mapProductsFromSignals(bundle.data);
    if (products?.length) {
      return createProducerEnvelope({
        organizationId,
        dataSource: "live",
        fallbackUsed: false,
        fallbackReasons: [],
        diagnostics: { upstreamPaths: ["commercial-network"] },
        payload: mapMarketingFromProducts(products),
      });
    }
    return fallbackProducerMarketingActivation(organizationId, "product_signals_unavailable");
  });
}

export async function handleProducerIndustrialSupplyLogistics(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerSupplyLogistics(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const pressure = await fetchUpstreamJson(
      req,
      `/v1/relational-supply-flow/pressure-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const critical = await fetchUpstreamJson(
      req,
      `/v1/relational-supply-flow/critical-flows?organizationId=${encodeURIComponent(organizationId)}&relationshipId=${encodeURIComponent(DEMO_RELATIONSHIP_ID)}`,
    );

    const base = fallbackProducerSupplyLogistics(organizationId, "partial").payload;
    const mapped = mapSupplyFlowToSupplyDto(pressure.data ?? critical.data, base);
    const live = pressure.ok || critical.ok;

    if (!live) return fallbackProducerSupplyLogistics(organizationId, "supply_flow_unavailable");

    return createProducerEnvelope({
      organizationId,
      dataSource: pressure.ok && critical.ok ? "live" : "mixed",
      fallbackUsed: !(pressure.ok && critical.ok),
      fallbackReasons: [
        ...(pressure.ok ? [] : ["pressure_overview_unavailable"]),
        ...(critical.ok ? [] : ["critical_flows_unavailable"]),
      ],
      diagnostics: { upstreamPaths: ["relational-supply-flow"] },
      payload: mapped,
    });
  });
}

export async function handleProducerIndustrialFinanceCollections(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerFinanceCollections(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const orders = await fetchUpstreamJson(
      req,
      `/v1/relational-orders/snapshot?organizationId=${encodeURIComponent(organizationId)}&projection=summary`,
    );
    const graph = await fetchUpstreamJson(
      req,
      `/v1/commercial-relationship-graph/bundle?organizationId=${encodeURIComponent(organizationId)}&projection=summary`,
    );

    const base = resolveFinanceBase();
    const partners = mapPartnersFromGraph(graph.data);
    const mapped = mapOrdersSnapshotToFinance(orders.data, {
      ...base,
      atRiskPartnerList: partners?.filter((p) => p.risk !== "stable") ?? base.atRiskPartnerList,
    });

    if (!orders.ok && !graph.ok) {
      return fallbackProducerFinanceCollections(organizationId, "finance_sources_unavailable");
    }

    return createProducerEnvelope({
      organizationId,
      dataSource: inferDataSource(orders.ok || graph.ok, !orders.ok || !graph.ok),
      fallbackUsed: !orders.ok || !graph.ok,
      fallbackReasons: [
        ...(orders.ok ? [] : ["orders_snapshot_unavailable"]),
        ...(graph.ok ? [] : ["partner_risk_unavailable"]),
      ],
      diagnostics: { upstreamPaths: ["relational-orders", "commercial-relationship-graph"] },
      payload: mapped,
    });
  });
}

export async function handleProducerIndustrialDataIntelligence(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerDataIntelligence(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const observatory = await fetchUpstreamJson(
      req,
      `/v1/relational-strategic-observatory/strategic-observatory-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const monitoring = await fetchUpstreamJson(
      req,
      `/v1/relational-economic-monitoring/economic-monitoring-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );

    const insights =
      mapObservatoryToIntelligence(observatory.data) ??
      (monitoring.data
        ? {
            insights: (mapMonitoringToAlerts(monitoring.data) ?? []).map((a) => ({
              id: a.id,
              severity: a.level === "critical" ? ("high" as const) : a.level === "warning" ? ("medium" as const) : ("low" as const),
              title: a.message,
              detail: a.suggestedAction ?? "Suivi recommandé",
            })),
          }
        : null);

    if (insights?.insights.length) {
      return createProducerEnvelope({
        organizationId,
        dataSource: inferDataSource(observatory.ok, !observatory.ok),
        fallbackUsed: !observatory.ok,
        fallbackReasons: observatory.ok ? [] : ["observatory_partial"],
        diagnostics: { upstreamPaths: ["strategic-observatory", "economic-monitoring"] },
        payload: insights,
      });
    }

    return fallbackProducerDataIntelligence(organizationId, "intelligence_unavailable");
  });
}

export async function handleProducerIndustrialMapControl(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerMapControl(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const geo = await fetchUpstreamJson(
      req,
      `/v1/relational-geo-economic/geo-economic-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const supply = await fetchUpstreamJson(
      req,
      `/v1/relational-supply-flow/critical-flows?organizationId=${encodeURIComponent(organizationId)}&relationshipId=${encodeURIComponent(DEMO_RELATIONSHIP_ID)}`,
    );

    const payload = mapGeoAndSupplyToMap(geo.data, supply.data);
    const live = geo.ok || supply.ok;
    if (!live) return fallbackProducerMapControl(organizationId, "map_sources_unavailable");

    return createProducerEnvelope({
      organizationId,
      dataSource: inferDataSource(geo.ok, !geo.ok || !supply.ok),
      fallbackUsed: !geo.ok || !supply.ok,
      fallbackReasons: [
        ...(geo.ok ? [] : ["geo_economic_unavailable"]),
        ...(supply.ok ? [] : ["supply_corridors_unavailable"]),
      ],
      diagnostics: { upstreamPaths: ["relational-geo-economic", "relational-supply-flow"] },
      payload,
    });
  });
}

export async function handleProducerIndustrialAlerts(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerAlerts(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const monitoring = await fetchUpstreamJson(
      req,
      `/v1/relational-economic-monitoring/economic-monitoring-overview/${encodeURIComponent(DEMO_RELATIONSHIP_ID)}?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const alerts = mapMonitoringToAlerts(monitoring.data);
    if (alerts?.length) {
      return createProducerEnvelope({
        organizationId,
        dataSource: "live",
        fallbackUsed: false,
        fallbackReasons: [],
        diagnostics: { upstreamPaths: ["economic-monitoring"] },
        payload: alerts,
      });
    }
    return fallbackProducerAlerts(organizationId, "alerts_unavailable");
  });
}

export async function handleProducerIndustrialPartners(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerPartners(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const graph = await fetchUpstreamJson(
      req,
      `/v1/commercial-relationship-graph/bundle?organizationId=${encodeURIComponent(organizationId)}&projection=summary`,
    );
    const partners = mapPartnersFromGraph(graph.data);
    if (partners?.length) {
      return createProducerEnvelope({
        organizationId,
        dataSource: "live",
        fallbackUsed: false,
        fallbackReasons: [],
        diagnostics: { upstreamPaths: ["commercial-relationship-graph"] },
        payload: partners,
      });
    }
    return fallbackProducerPartners(organizationId, "partners_unavailable");
  });
}

export async function handleProducerIndustrialProducts(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerProducts(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const bundle = await fetchUpstreamJson(
      req,
      `/v1/commercial-network/bundle?organizationId=${encodeURIComponent(organizationId)}`,
    );
    const products = mapProductsFromSignals(bundle.data);
    if (products?.length) {
      return createProducerEnvelope({
        organizationId,
        dataSource: "live",
        fallbackUsed: false,
        fallbackReasons: [],
        diagnostics: { upstreamPaths: ["commercial-network"] },
        payload: products,
      });
    }
    return fallbackProducerProducts(organizationId, "products_unavailable");
  });
}

export async function handleProducerIndustrialOrdersSummary(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  if (!liveDataFlagEnabled()) {
    return fallbackProducerOrdersSummary(organizationId, "feature_flag_disabled");
  }

  return withTiming(organizationId, async () => {
    const orders = await fetchUpstreamJson(
      req,
      `/v1/relational-orders/snapshot?organizationId=${encodeURIComponent(organizationId)}&projection=summary`,
    );
    const summary = mapOrdersSnapshotSummary(orders.data);
    if (summary) {
      return createProducerEnvelope({
        organizationId,
        dataSource: "live",
        fallbackUsed: false,
        fallbackReasons: [],
        diagnostics: { upstreamPaths: ["relational-orders"] },
        payload: summary,
      });
    }
    return fallbackProducerOrdersSummary(organizationId, "orders_unavailable");
  });
}

export async function handleProducerIndustrialNetworkActivity(req: NextRequest) {
  const organizationId = resolveOrganizationId(req);
  const commercialEnv = await handleProducerIndustrialCommercialNetwork(req);
  const ordersEnv = await handleProducerIndustrialOrdersSummary(req);
  const activity = mapNetworkActivity(
    commercialEnv.fallbackUsed ? null : commercialEnv.payload,
    ordersEnv.fallbackUsed ? null : ordersEnv.payload,
  );

  if (!activity) {
    return fallbackProducerNetworkActivity(organizationId, "network_activity_unavailable");
  }

  return createProducerEnvelope({
    organizationId,
    dataSource: mergeDataSource(commercialEnv.dataSource, ordersEnv.dataSource),
    fallbackUsed: commercialEnv.fallbackUsed || ordersEnv.fallbackUsed,
    fallbackReasons: [...commercialEnv.fallbackReasons, ...ordersEnv.fallbackReasons],
    diagnostics: {
      upstreamPaths: ["commercial-network", "relational-orders"],
    },
    payload: activity,
  });
}

export async function dispatchProducerIndustrialBff(
  req: NextRequest,
  segment: string,
): Promise<Response> {
  const handlers: Record<string, (r: NextRequest) => Promise<ProducerIndustrialEnvelope<unknown>>> = {
    overview: handleProducerIndustrialOverview,
    executive: handleProducerIndustrialExecutive,
    "commercial-network": handleProducerIndustrialCommercialNetwork,
    "marketing-activation": handleProducerIndustrialMarketingActivation,
    "supply-logistics": handleProducerIndustrialSupplyLogistics,
    "finance-collections": handleProducerIndustrialFinanceCollections,
    "data-intelligence": handleProducerIndustrialDataIntelligence,
    "map-control": handleProducerIndustrialMapControl,
    alerts: handleProducerIndustrialAlerts,
    partners: handleProducerIndustrialPartners,
    products: handleProducerIndustrialProducts,
    "orders-summary": handleProducerIndustrialOrdersSummary,
    "network-activity": handleProducerIndustrialNetworkActivity,
  };

  const handler = handlers[segment];
  if (!handler) {
    return Response.json({ error: "not_found", segment }, { status: 404 });
  }

  try {
    const envelope = await handler(req);
    return Response.json(envelope, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "bff_error";
    return Response.json({ error: message, segment }, { status: 500 });
  }
}
