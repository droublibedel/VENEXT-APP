import { useEffect } from "react";

import { parseWalletBalanceFcfa } from "./venext-wallet-adaptive-session";
import { syncWalletBalanceFcfa } from "./venext-wallet-balance-sync";

/** Pousse le solde wallet vers la sécurité adaptative (Instruction 20.78-A). */
export function useWalletBalanceSync(balanceLabelOrFcfa: string | number | undefined | null): void {
  useEffect(() => {
    const fcfa = parseWalletBalanceFcfa(balanceLabelOrFcfa);
    syncWalletBalanceFcfa(fcfa);
  }, [balanceLabelOrFcfa]);
}
