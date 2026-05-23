import { Injectable } from "@nestjs/common";
import { RelationalMacroObservatoryGovernanceType } from "@prisma/client";

import type { MacroObservatoryGovernanceCorridorContext } from "./relational-macro-observatory-governance-corridor-context.service";

@Injectable()
export class RelationalMacroObservatoryGovernanceBalanceService {
  resolveMacroGovernanceType(
    ctx: MacroObservatoryGovernanceCorridorContext,
    executiveCoordinationPressure: number,
    systemicConcentration: number,
  ): RelationalMacroObservatoryGovernanceType {
    if (executiveCoordinationPressure >= 72) {
      return RelationalMacroObservatoryGovernanceType.EXECUTIVE_NETWORK_ALIGNMENT;
    }
    if (systemicConcentration >= 65) {
      return RelationalMacroObservatoryGovernanceType.SYSTEMIC_GOVERNANCE;
    }
    if (ctx.sectorSlug) return RelationalMacroObservatoryGovernanceType.NETWORK_COORDINATION;
    return RelationalMacroObservatoryGovernanceType.MACRO_GOVERNANCE_OVERVIEW;
  }
}
