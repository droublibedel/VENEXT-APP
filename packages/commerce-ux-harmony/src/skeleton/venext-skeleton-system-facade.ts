import { VenextSkeletonScreen } from "./VenextSkeletonScreen";
import {
  VenextSkeletonBase,
  VenextSkeletonCard,
  VenextSkeletonChart,
  VenextSkeletonDashboard,
  VenextSkeletonForm,
  VenextSkeletonList,
  VenextSkeletonMessage,
  VenextSkeletonNotification,
  VenextSkeletonOrder,
  VenextSkeletonPole,
  VenextSkeletonProduct,
  VenextSkeletonTable,
  VenextSkeletonText,
  VenextSkeletonWallet,
  resolveVenextSkeletonForScreen,
} from "./venext-skeleton-system";

/** Façade officielle VenextSkeletonSystem (Instruction 20.87-A). */
export const VenextSkeletonSystem = {
  Base: VenextSkeletonBase,
  Text: VenextSkeletonText,
  Card: VenextSkeletonCard,
  List: VenextSkeletonList,
  Table: VenextSkeletonTable,
  Chart: VenextSkeletonChart,
  Message: VenextSkeletonMessage,
  Dashboard: VenextSkeletonDashboard,
  Form: VenextSkeletonForm,
  Product: VenextSkeletonProduct,
  Order: VenextSkeletonOrder,
  Pole: VenextSkeletonPole,
  Wallet: VenextSkeletonWallet,
  Notification: VenextSkeletonNotification,
  Screen: VenextSkeletonScreen,
  resolveForScreen: resolveVenextSkeletonForScreen,
} as const;
