import type { CommercialContextModule, CommercialNavigationIntent } from "./commercial-context-routing.types";

export type CommercialScreenIntent =
  | "view-order"
  | "view-delivery"
  | "view-settlement"
  | "view-conversation"
  | "view-mail-thread"
  | "view-activity"
  | "view-catalog";

export function screenIntentFromModule(module: CommercialContextModule): CommercialScreenIntent | null {
  switch (module) {
    case "order":
      return "view-order";
    case "delivery":
      return "view-delivery";
    case "wallet":
      return "view-settlement";
    case "messaging":
      return "view-conversation";
    case "mail":
      return "view-mail-thread";
    case "activity":
      return "view-activity";
    case "catalog":
      return "view-catalog";
    default:
      return null;
  }
}

export function screenIntentFromNavigationIntent(
  intent: CommercialNavigationIntent,
): CommercialScreenIntent | null {
  return screenIntentFromModule(intent.target);
}
