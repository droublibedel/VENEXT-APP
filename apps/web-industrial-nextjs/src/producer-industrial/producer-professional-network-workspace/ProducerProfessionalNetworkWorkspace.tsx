"use client";

import { memo, useMemo } from "react";
import { ProfessionalCommercialNetworkShell } from "professional-commercial-network";
import "professional-commercial-network/styles.css";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { buildProducerProfessionalNetworkInjected } from "./producer-professional-network-adapter";
import { useProducerProfessionalNetworkData } from "./useProducerProfessionalNetworkData";

export const ProducerProfessionalNetworkWorkspace = memo(function ProducerProfessionalNetworkWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled =
    hydrated &&
    flags.professional_commercial_network_enabled !== false &&
    flags.producer_partner_network_enabled !== false;

  const data = useProducerProfessionalNetworkData(enabled);

  const injected = useMemo(
    () =>
      buildProducerProfessionalNetworkInjected({
        commercial: data.commercial,
        partners: data.partners,
        orders: data.orders,
        finance: data.finance,
        network: data.network,
        loading: data.loading,
        error: data.error,
        dataSource: data.dataSource,
        fallbackUsed: data.fallbackUsed,
        onRefresh: data.refresh,
      }),
    [data],
  );

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="producer-professional-network-disabled"
      >
        Le réseau commercial professionnel n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  return (
    <section data-testid="producer-professional-network-workspace" className="space-y-4">
      <ProducerSectionHeader
        kicker="Réseau B2B formel"
        title="Partenaires grossistes structurés"
        subtitle="Invitations, validation explicite, catalogues fermés — distinct du réseau terrain."
      />
      <ProducerDataSourceHint
        dataSource={data.dataSource}
        fallbackUsed={data.fallbackUsed}
        loading={data.loading}
      />
      {data.error ? (
        <p className="text-[11px] text-amber-400/90" data-testid="producer-pcn-error">
          {data.error}
        </p>
      ) : null}
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        enabled={enabled}
        injected={injected}
        flags={{
          professional_commercial_network_enabled: flags.professional_commercial_network_enabled,
          producer_partner_network_enabled: flags.producer_partner_network_enabled,
        }}
      />
    </section>
  );
});
