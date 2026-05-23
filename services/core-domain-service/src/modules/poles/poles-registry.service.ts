import { Injectable } from "@nestjs/common";
import { OrgMemberPole } from "@prisma/client";

export type PoleRegistryEntry = {
  pole: OrgMemberPole;
  routeSlug: string;
  displayName: string;
  operationalRole: string;
  mapCommandFamilies: string[];
};

const ENTRIES: PoleRegistryEntry[] = [
  {
    pole: OrgMemberPole.DIRECTION_STRATEGY,
    routeSlug: "direction-strategy",
    displayName: "Direction & strategy",
    operationalRole: "Macro corridor intelligence",
    mapCommandFamilies: [
      "national_demand_heatmap",
      "commercial_growth_zones",
      "strategic_tension_zones",
      "partner_expansion_density",
      "macro_consumption_evolution",
    ],
  },
  {
    pole: OrgMemberPole.COMMERCIAL_NETWORK,
    routeSlug: "commercial-network",
    displayName: "Commercial network",
    operationalRole: "Relationship-field interpretation",
    mapCommandFamilies: [
      "active_wholesalers",
      "retailer_relationship_density",
      "inactive_zones",
      "network_growth_opportunities",
      "relationship_health",
    ],
  },
  {
    pole: OrgMemberPole.MARKETING_ACTIVATION,
    routeSlug: "marketing-activation",
    displayName: "Marketing activation",
    operationalRole: "Diffusion & attention cockpit",
    mapCommandFamilies: [
      "campaign_diffusion",
      "sponsored_product_propagation",
      "engagement_zones",
      "product_attention_signals",
      "seasonal_behavioral_shifts",
    ],
  },
  {
    pole: OrgMemberPole.ORDERS_ADV,
    routeSlug: "orders-adv",
    displayName: "Orders & ADV",
    operationalRole: "Order-flow command surface",
    mapCommandFamilies: [
      "order_flow_density",
      "pending_orders",
      "blocked_orders",
      "negotiation_activity",
      "fulfillment_bottlenecks",
    ],
  },
  {
    pole: OrgMemberPole.SUPPLY_LOGISTICS,
    routeSlug: "supply-logistics",
    displayName: "Supply & logistics",
    operationalRole: "Movement & rupture intelligence",
    mapCommandFamilies: [
      "truck_movement",
      "warehouse_activity",
      "route_anomalies",
      "stock_movement",
      "delivery_eta_risk",
    ],
  },
  {
    pole: OrgMemberPole.FINANCE_COLLECTIONS,
    routeSlug: "finance-collections",
    displayName: "Finance & collections",
    operationalRole: "Liquidity pressure field",
    mapCommandFamilies: [
      "unpaid_zones",
      "payment_velocity",
      "collection_pressure",
      "wallet_activity",
      "delayed_payments",
    ],
  },
  {
    pole: OrgMemberPole.DATA_INTELLIGENCE,
    routeSlug: "data-intelligence",
    displayName: "Data intelligence",
    operationalRole: "Correlation & anomaly theatre",
    mapCommandFamilies: [
      "signal_correlations",
      "predictive_consumption",
      "anomaly_detection",
      "external_data_influence",
      "forecast_projections",
    ],
  },
  {
    pole: OrgMemberPole.INDUSTRIAL_SAFETY,
    routeSlug: "industrial-safety",
    displayName: "Industrial safety",
    operationalRole: "Incident & emergency command",
    mapCommandFamilies: [
      "industrial_incidents",
      "fire_risk_overlays",
      "emergency_response_layers",
      "hydrant_proximity",
      "hazardous_zones",
    ],
  },
];

@Injectable()
export class PolesRegistryService {
  list(): PoleRegistryEntry[] {
    return ENTRIES;
  }

  bySlug(slug: string): PoleRegistryEntry | undefined {
    return ENTRIES.find((e) => e.routeSlug === slug);
  }

  byPole(pole: OrgMemberPole): PoleRegistryEntry | undefined {
    return ENTRIES.find((e) => e.pole === pole);
  }
}
