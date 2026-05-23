import { memo } from "react";

import { getWalletModeLabel } from "../governance/commerce-wallet-governance";
import type { WalletMode } from "../governance/commerce-wallet-governance.types";
import {
  SETTLEMENT_METHOD_LABELS,
  SETTLEMENT_STATUS_DISPLAY,
  type SettlementMethod,
} from "./commerce-settlement.types";

export const CommerceSettlementStatusBadge = memo(function CommerceSettlementStatusBadge({
  method,
  mode,
  testId = "cw-settlement-status-badge",
}: {
  method: SettlementMethod;
  mode?: WalletMode;
  testId?: string;
}) {
  const label = SETTLEMENT_STATUS_DISPLAY[method] ?? SETTLEMENT_METHOD_LABELS[method];
  return (
    <span
      className="cw-settlement-badge"
      data-testid={testId}
      data-method={method}
      data-mode={mode}
      title={mode ? getWalletModeLabel(mode) : undefined}
    >
      {label}
    </span>
  );
});
