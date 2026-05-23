"use client";

import type { EnterpriseCommercialChannel } from "./enterprise-governance.types";
import { EnterpriseChannelWorkspace } from "./EnterpriseChannelWorkspace";
import { EnterpriseGovernanceDataSourceBadge } from "./EnterpriseGovernanceDataSourceBadge";
import { useEnterpriseGovernanceLiveChannelDetail } from "./enterprise-governance-live-hooks";

type Props = {
  enterpriseId: string;
  locale?: string;
  fallbackChannel?: EnterpriseCommercialChannel;
};

export function EnterpriseChannelWorkspaceLive({ enterpriseId, locale = "fr-CI", fallbackChannel }: Props) {
  const { loading, envelope } = useEnterpriseGovernanceLiveChannelDetail(enterpriseId);
  const channel = (envelope?.data ?? fallbackChannel) as EnterpriseCommercialChannel | undefined;

  if (loading && !channel) {
    return <p className="ecg-muted">Chargement canal…</p>;
  }
  if (!channel) {
    return <p className="ecg-muted">Canal introuvable</p>;
  }

  return (
    <div>
      {envelope ? (
        <EnterpriseGovernanceDataSourceBadge
          dataSource={envelope.dataSource}
          fallbackUsed={envelope.fallbackUsed}
          error={envelope.error}
        />
      ) : null}
      <EnterpriseChannelWorkspace channel={channel} locale={locale} />
    </div>
  );
}
