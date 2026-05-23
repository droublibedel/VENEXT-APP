"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { PoleSlug } from "../types";

function loadPole(pole: PoleSlug) {
  switch (pole) {
    case "direction-strategy":
      return dynamic(() => import("../direction-strategy/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "commercial-network":
      return dynamic(() => import("../commercial-network/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "marketing-activation":
      return dynamic(() => import("../marketing-activation/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "orders-adv":
      return dynamic(() => import("../orders-adv/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "supply-logistics":
      return dynamic(() => import("../supply-logistics/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "finance-collections":
      return dynamic(() => import("../finance-collections/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "data-intelligence":
      return dynamic(() => import("../data-intelligence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "economic-memory":
      return dynamic(() => import("../economic-memory/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "economic-scenarios":
      return dynamic(() => import("../economic-scenarios/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "economic-propagation":
      return dynamic(() => import("../economic-propagation/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "economic-coordination":
      return dynamic(() => import("../economic-coordination/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "economic-command":
      return dynamic(() => import("../economic-command/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "industrial-situation-room":
      return dynamic(() => import("../industrial-situation-room/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "industrial-operational-continuity":
      return dynamic(() => import("../industrial-operational-continuity/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "industrial-evidence":
      return dynamic(() => import("../industrial-evidence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "commercial-relationship-graph":
      return dynamic(() => import("../commercial-relationship-graph/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-catalog":
      return dynamic(() => import("../relational-catalog/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-cart":
      return dynamic(() => import("../relational-cart/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-orders":
      return dynamic(() => import("../relational-orders/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-order-execution":
      return dynamic(() => import("../relational-order-execution/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-fulfillment":
      return dynamic(() => import("../relational-fulfillment/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-operational-intelligence":
      return dynamic(() => import("../relational-operational-intelligence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-predictive-risk":
      return dynamic(() => import("../relational-predictive-risk/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-operational-recommendation":
      return dynamic(() => import("../relational-operational-recommendation/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-operational-orchestration":
      return dynamic(() => import("../relational-operational-orchestration/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-operational-simulation":
      return dynamic(() => import("../relational-operational-simulation/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-scenario-review":
      return dynamic(() => import("../relational-scenario-review/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-strategic-memory":
      return dynamic(() => import("../relational-strategic-memory/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-signal-graph":
      return dynamic(() => import("../relational-economic-signal-graph/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-command-center":
      return dynamic(() => import("../relational-economic-command-center/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-pressure":
      return dynamic(() => import("../relational-economic-pressure/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-geo-economic":
      return dynamic(() => import("../relational-geo-economic/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-sector-intelligence":
      return dynamic(() => import("../relational-sector-intelligence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-supply-flow":
      return dynamic(() => import("../relational-supply-flow/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-macro-economic":
      return dynamic(() => import("../relational-macro-economic/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-continuity":
      return dynamic(() => import("../relational-economic-continuity/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-sovereignty":
      return dynamic(() => import("../relational-economic-sovereignty/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-recovery":
      return dynamic(() => import("../relational-economic-recovery/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-governance":
      return dynamic(() => import("../relational-economic-governance/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-arbitration":
      return dynamic(() => import("../relational-economic-arbitration/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-stabilization":
      return dynamic(() => import("../relational-economic-stabilization/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-economic-monitoring":
      return dynamic(() => import("../relational-economic-monitoring/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-executive-orchestration":
      return dynamic(() => import("../relational-executive-orchestration/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-institutional-reporting":
      return dynamic(() => import("../relational-institutional-reporting/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-strategic-intelligence":
      return dynamic(() => import("../relational-strategic-intelligence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-strategic-command":
      return dynamic(() => import("../relational-strategic-command/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-executive-operations":
      return dynamic(() => import("../relational-executive-operations/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-executive-control-room":
      return dynamic(() => import("../relational-executive-control-room/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-executive-strategic-synthesis":
      return dynamic(() => import("../relational-executive-strategic-synthesis/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-global-executive-supervision":
      return dynamic(() => import("../relational-global-executive-supervision/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-macro-observatory-governance":
      return dynamic(() => import("../relational-macro-observatory-governance/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "relational-strategic-observatory":
      return dynamic(() => import("../relational-strategic-observatory/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "commercial-trust":
      return dynamic(() => import("../commercial-trust/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "corridor-intelligence":
      return dynamic(() => import("../corridor-intelligence/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    case "industrial-safety":
      return dynamic(() => import("../industrial-safety/PoleWorkspace"), {
        ssr: false,
        loading: () => <PoleLoading />,
      });
    default: {
      const _exhaustive: never = pole;
      throw new Error(`Unknown pole: ${String(_exhaustive)}`);
    }
  }
}

function PoleLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-xs uppercase tracking-[0.3em] text-cyan-200/80">
      Mounting operational cockpit…
    </div>
  );
}

export function PoleEntryClient({ pole }: { pole: PoleSlug }) {
  const Cmp = useMemo(() => loadPole(pole), [pole]);
  return <Cmp />;
}
