/** Instruction 14 — Orders/ADV pole realtime contract (demo.* / live.*). */
export const ORDER_ADV_REALTIME_EVENT_TYPES = [
  "demo.order_adv.negotiation.burst",
  "demo.order_adv.group_buying.spike",
  "demo.order_adv.reservation.pressure",
  "demo.order_adv.delivery.instability",
  "demo.order_adv.conversational.commerce",
  "live.order_adv.negotiation.burst",
  "live.order_adv.group_buying.spike",
  "live.order_adv.reservation.pressure",
  "live.order_adv.delivery.instability",
  "live.order_adv.conversational.commerce",
] as const;

export type OrderAdvRealtimeEventType = (typeof ORDER_ADV_REALTIME_EVENT_TYPES)[number];
