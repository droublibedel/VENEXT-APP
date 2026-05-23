import { fetchEconomicScenariosJson } from "./economic-scenarios-api";

export type EconomicScenariosSequentialSlices = {
  overview: unknown;
  scenarios: unknown;
  trajectories: unknown;
  comparisons: unknown;
};

export async function loadEconomicScenariosSlicesSequential(organizationId: string): Promise<EconomicScenariosSequentialSlices> {
  const overview = await fetchEconomicScenariosJson("/overview", organizationId);
  const scenarios = await fetchEconomicScenariosJson("/scenarios", organizationId);
  const trajectories = await fetchEconomicScenariosJson("/trajectories", organizationId);
  const comparisons = await fetchEconomicScenariosJson("/comparisons", organizationId);
  return { overview, scenarios, trajectories, comparisons };
}
