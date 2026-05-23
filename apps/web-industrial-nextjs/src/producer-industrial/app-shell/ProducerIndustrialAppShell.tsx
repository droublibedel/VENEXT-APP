"use client";

import { useState } from "react";

import { CommercialRouterProvider, type ProducerWorkspaceTabDestination } from "commercial-context-routing";

import { ProducerDashboardByPole } from "../dashboards/producer-dashboard-loader";
import { useProducerExecutive, useProducerMapControl } from "../hooks/useProducerIndustrialLiveData";
import { useProducerPoleNavigation } from "../hooks/useProducerPoleNavigation";
import { PRODUCER_EXECUTIVE_SUMMARY } from "../mocks/industrial-mock-data";
import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { useProducerCommercialRouter } from "../routing/useProducerCommercialRouter";
import { ProducerCommercialRoutingProvider } from "../routing/ProducerCommercialRoutingContext";
import { ProducerAlertCenter } from "./ProducerAlertCenter";
import { ProducerIndustrialTopBar } from "./ProducerIndustrialTopBar";
import { ProducerNotificationsBridge } from "../notifications/ProducerNotificationsBridge";
import { ProducerOfflineBridge } from "../offline/ProducerOfflineBridge";
import { IndustrialHumanizedErrorsBridge } from "@/errors/IndustrialHumanizedErrorsBridge";
import { IndustrialLiveObservabilityBridge } from "@/observability/IndustrialLiveObservabilityBridge";
import { IndustrialPerformanceBridge } from "@/performance/IndustrialPerformanceBridge";
import { IndustrialUxHarmonyBridge } from "@/ux/IndustrialUxHarmonyBridge";

function ProducerQuickReturnBar({
  canGoBack,
  goBack,
}: {
  canGoBack: boolean;
  goBack: () => void;
}) {
  if (!canGoBack) return null;
  return (
    <button
      type="button"
      data-testid="producer-commercial-quick-return"
      onClick={goBack}
      className="mx-4 mb-2 rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
    >
      ← Retour au flux précédent
    </button>
  );
}

export function ProducerIndustrialAppShell() {
  const { activePole, selectPole, mobileNavOpen, setMobileNavOpen, closeMobileNav } =
    useProducerPoleNavigation();
  const [relationalTab, setRelationalTab] = useState<ProducerWorkspaceTabDestination | undefined>();
  const { router, routingInput, canGoBack, goBack } = useProducerCommercialRouter(
    selectPole,
    setRelationalTab,
  );
  const { data: executiveData } = useProducerExecutive();
  const mapState = useProducerMapControl();
  const executive = executiveData ?? PRODUCER_EXECUTIVE_SUMMARY;

  return (
    <CommercialRouterProvider router={router} flags={routingInput.flags}>
      <ProducerCommercialRoutingProvider
        value={{
          routingInput,
          relationalTab,
          setRelationalTab,
          canGoBack,
          goBack,
        }}
      >
        <div className="producer-industrial-root flex min-h-dvh" data-testid="producer-industrial-shell">
          {mobileNavOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
              aria-label="Fermer menu"
              onClick={closeMobileNav}
            />
          ) : null}
          <ProducerPoleNav
            activePole={activePole}
            onSelect={selectPole}
            mobileOpen={mobileNavOpen}
            onMobileClose={closeMobileNav}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <ProducerIndustrialTopBar activePole={activePole} onMenuToggle={() => setMobileNavOpen((v) => !v)} />
            <ProducerNotificationsBridge />
            <IndustrialUxHarmonyBridge />
            <IndustrialHumanizedErrorsBridge />
            <IndustrialLiveObservabilityBridge />
            <IndustrialPerformanceBridge />
            <ProducerOfflineBridge />
            <div className="grid gap-0 border-b border-slate-800/60 bg-slate-950/40 px-4 py-2 lg:grid-cols-3">
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 lg:col-span-2">
                <span>
                  Stabilité <strong className="text-emerald-400">{executive.networkStability}%</strong>
                </span>
                <span>
                  Partenaires <strong className="text-slate-200">{executive.activePartners}</strong>
                </span>
                <span>
                  Corridors critiques <strong className="text-amber-400">{executive.criticalCorridors}</strong>
                </span>
              </div>
              <div className="hidden lg:block">
                <IndustrialMapControlSystem
                  compact
                  layer="activity"
                  testId="shell-mini-map"
                  data={mapState.data ?? undefined}
                  dataSource={mapState.dataSource}
                />
              </div>
            </div>
            <ProducerQuickReturnBar canGoBack={canGoBack} goBack={goBack} />
            <main className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <ProducerDashboardByPole pole={activePole} />
              </div>
              <ProducerAlertCenter />
            </main>
          </div>
        </div>
      </ProducerCommercialRoutingProvider>
    </CommercialRouterProvider>
  );
}
