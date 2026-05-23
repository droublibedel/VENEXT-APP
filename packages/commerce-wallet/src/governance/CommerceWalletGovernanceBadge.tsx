import { memo } from "react";

import { getWalletModeLabel } from "./commerce-wallet-governance";
import type { WalletMode } from "./commerce-wallet-governance.types";

export const CommerceWalletGovernanceBadge = memo(function CommerceWalletGovernanceBadge({
  mode,
  testId = "cw-governance-badge",
}: {
  mode: WalletMode;
  testId?: string;
}) {
  return (
    <span className="cw-badge" data-testid={testId} data-mode={mode}>
      {getWalletModeLabel(mode)}
    </span>
  );
});
