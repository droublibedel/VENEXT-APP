import { memo } from "react";

export const CommerceSettlementPartnerNotice = memo(function CommerceSettlementPartnerNotice({
  partnerName,
  confirmed,
  required,
  testId = "cw-settlement-partner-notice",
}: {
  partnerName?: string;
  confirmed: boolean;
  required: boolean;
  testId?: string;
}) {
  if (!required && !partnerName) return null;
  return (
    <aside className="cw-partner-notice" data-testid={testId} data-confirmed={confirmed ? "true" : "false"}>
      <p style={{ margin: 0, fontSize: 13 }}>
        {confirmed
          ? `Confirmation partenaire reçue${partnerName ? ` — ${partnerName}` : ""}.`
          : `Confirmation partenaire requise${partnerName ? ` — ${partnerName}` : ""}.`}
      </p>
    </aside>
  );
});
