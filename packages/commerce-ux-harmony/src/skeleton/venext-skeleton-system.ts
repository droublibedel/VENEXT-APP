export { VenextSkeletonBase } from "./VenextSkeletonBase";
export type { VenextSkeletonBaseProps } from "./VenextSkeletonBase";
export {
  VenextSkeletonText,
  VenextSkeletonCard,
  VenextSkeletonList,
  VenextSkeletonTable,
  VenextSkeletonChart,
  VenextSkeletonMessage,
  VenextSkeletonDashboard,
  VenextSkeletonForm,
  VenextSkeletonProduct,
  VenextSkeletonOrder,
  VenextSkeletonPole,
  VenextSkeletonWallet,
  VenextSkeletonNotification,
} from "./VenextSkeletonComponents";

export type VenextSkeletonScreenVariant =
  | "dashboard"
  | "wallet"
  | "messaging"
  | "catalog"
  | "orders"
  | "notifications"
  | "pole"
  | "form"
  | "table"
  | "product";

/** Sélecteur officiel — skeleton fidèle au contenu final (Instruction 20.87). */
export function resolveVenextSkeletonForScreen(variant: VenextSkeletonScreenVariant) {
  return variant;
}
