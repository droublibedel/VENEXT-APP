"use client";

import { memo } from "react";

import { CommercePartnerPaymentCard } from "commerce-wallet";
import type { CommercePartnerPayment } from "commerce-wallet";

export const ProducerPartnerSettlementPanel = memo(function ProducerPartnerSettlementPanel({
  partners,
}: {
  partners: CommercePartnerPayment[];
}) {
  return (
    <div className="space-y-3" data-testid="producer-partner-settlement-panel">
      <p className="text-sm text-slate-400">Règlements partenaires et encaissements réseau.</p>
      {partners.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun règlement partenaire en attente.</p>
      ) : (
        partners.map((p) => <CommercePartnerPaymentCard key={p.id} payment={p} />)
      )}
    </div>
  );
});
