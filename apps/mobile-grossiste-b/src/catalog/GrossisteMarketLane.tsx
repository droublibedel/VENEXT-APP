import { memo, useState } from "react";

import { GrossisteDataSourceBadge } from "../components/GrossisteDataSourceBadge";
import { GrossisteProductCard } from "../widgets/GrossisteProductCard";
import {
  transferMarketProductToCatalogue,
  useGrossisteMarketData,
} from "../hooks/useGrossisteMarketData";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

export const GrossisteMarketLane = memo(function GrossisteMarketLane({ enabled }: { enabled: boolean }) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteMarketData(enabled);
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const handleTransfer = async (productId: string) => {
    setTransferringId(productId);
    try {
      await transferMarketProductToCatalogue(productId, resolveGrossisteBOrganizationId());
      refresh();
    } finally {
      setTransferringId(null);
    }
  };

  return (
    <div data-testid="grossiste-market-lane">
      <GrossisteDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <p style={{ fontSize: 12, color: "var(--venext-text-muted)", margin: "0 0 12px" }}>
        Produits fournisseurs — pas vos publications
      </p>
      {(data?.products ?? []).map((p) => (
        <div key={p.id} style={{ marginBottom: 8 }}>
          <GrossisteProductCard product={p} />
          <button
            type="button"
            data-testid={`grossiste-market-transfer-${p.id}`}
            disabled={transferringId === p.id}
            onClick={() => void handleTransfer(p.id)}
            style={{ width: "100%", minHeight: 40, marginTop: 4, fontWeight: 600 }}
          >
            {transferringId === p.id ? "Transfert…" : "Ajouter à mon catalogue"}
          </button>
        </div>
      ))}
    </div>
  );
});
