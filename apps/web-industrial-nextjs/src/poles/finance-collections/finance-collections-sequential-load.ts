export const FINANCE_CRITICAL = [
  "/overview",
  "/briefing",
  "/collection-priorities",
  "/interventions",
  "/payment-pressure",
] as const;

export const FINANCE_EXTENDED = [
  "/receivables-health",
  "/payment-behavior",
  "/wallet-liquidity",
  "/credit-risk",
  "/cashflow",
  "/payment-anomalies",
] as const;

export type FinanceBundleKey =
  | "overview"
  | "briefing"
  | "collectionPriorities"
  | "interventions"
  | "paymentPressure"
  | "receivablesHealth"
  | "paymentBehavior"
  | "walletLiquidity"
  | "creditRisk"
  | "cashflow"
  | "paymentAnomalies";

const MAP: Record<string, FinanceBundleKey> = {
  "/overview": "overview",
  "/briefing": "briefing",
  "/collection-priorities": "collectionPriorities",
  "/interventions": "interventions",
  "/payment-pressure": "paymentPressure",
  "/receivables-health": "receivablesHealth",
  "/payment-behavior": "paymentBehavior",
  "/wallet-liquidity": "walletLiquidity",
  "/credit-risk": "creditRisk",
  "/cashflow": "cashflow",
  "/payment-anomalies": "paymentAnomalies",
};

export type FinancePartialBundle = Partial<Record<FinanceBundleKey, unknown>>;

export async function loadFinanceCollectionsSequential(
  fetchPanel: (suffix: string) => Promise<unknown | null>,
): Promise<{ partial: FinancePartialBundle; loadOrder: string[] }> {
  const partial: FinancePartialBundle = {};
  const loadOrder: string[] = [];
  for (const suffix of FINANCE_CRITICAL) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  for (const suffix of FINANCE_EXTENDED) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  return { partial, loadOrder };
}
