/**
 * Instruction 14A — when the bundle endpoint fails, load panels sequentially (critical first)
 * so the backend never receives 11 parallel full-snapshot rebuilds.
 */

export const ORDER_ADV_CRITICAL_SUFFIXES = ["/overview", "/briefing", "/risk-matrix", "/interventions"] as const;

export const ORDER_ADV_EXTENDED_SUFFIXES = [
  "/conversational-commerce",
  "/negotiations",
  "/order-pressure",
  "/group-buying",
  "/reservations",
  "/delivery-priority",
  "/adv-coordination",
] as const;

export type OrderAdvSequentialBundleKey =
  | "overview"
  | "briefing"
  | "riskMatrix"
  | "interventions"
  | "conversationalCommerce"
  | "negotiations"
  | "orderPressure"
  | "groupBuying"
  | "reservations"
  | "deliveryPriority"
  | "advCoordination";

const SUFFIX_TO_KEY: Record<string, OrderAdvSequentialBundleKey> = {
  "/overview": "overview",
  "/briefing": "briefing",
  "/risk-matrix": "riskMatrix",
  "/interventions": "interventions",
  "/conversational-commerce": "conversationalCommerce",
  "/negotiations": "negotiations",
  "/order-pressure": "orderPressure",
  "/group-buying": "groupBuying",
  "/reservations": "reservations",
  "/delivery-priority": "deliveryPriority",
  "/adv-coordination": "advCoordination",
};

export type OrderAdvPartialBundle = Partial<Record<OrderAdvSequentialBundleKey, unknown>>;

export async function loadOrderAdvSequential(
  fetchPanel: (suffix: string) => Promise<unknown | null>,
): Promise<{ partial: OrderAdvPartialBundle; loadOrder: string[] }> {
  const partial: OrderAdvPartialBundle = {};
  const loadOrder: string[] = [];

  for (const suffix of ORDER_ADV_CRITICAL_SUFFIXES) {
    const data = await fetchPanel(suffix);
    const key = SUFFIX_TO_KEY[suffix];
    if (key) partial[key] = data ?? undefined;
    loadOrder.push(suffix);
  }

  for (const suffix of ORDER_ADV_EXTENDED_SUFFIXES) {
    const data = await fetchPanel(suffix);
    const key = SUFFIX_TO_KEY[suffix];
    if (key) partial[key] = data ?? undefined;
    loadOrder.push(suffix);
  }

  return { partial, loadOrder };
}
