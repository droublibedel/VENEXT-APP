import type {
  DataIntelligenceBundleResponse,
  EconomicCoordinationBundle,
  EconomicMemoryBundle,
  EconomicPropagationBundle,
  EconomicScenariosBundle,
} from "@venext/shared-contracts";

/** Shared read-only inputs for command heuristics (Instruction 18.5). */
export type EconomicCommandComposeContext = {
  organizationId: string;
  propagationBundle: EconomicPropagationBundle;
  scenariosBundle: EconomicScenariosBundle;
  coordinationBundle: EconomicCoordinationBundle;
  memoryBundle: EconomicMemoryBundle;
  dataIntelligenceBundle: DataIntelligenceBundleResponse;
};
