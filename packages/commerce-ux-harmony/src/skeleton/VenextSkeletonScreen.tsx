import {
  VenextSkeletonDashboard,
  VenextSkeletonForm,
  VenextSkeletonMessage,
  VenextSkeletonNotification,
  VenextSkeletonOrder,
  VenextSkeletonPole,
  VenextSkeletonProduct,
  VenextSkeletonTable,
  VenextSkeletonWallet,
} from "./VenextSkeletonComponents";
import type { VenextSkeletonScreenVariant } from "./venext-skeleton-system";

export type VenextSkeletonScreenProps = {
  variant?: VenextSkeletonScreenVariant;
  tall?: boolean;
  testId?: string;
};

/** Écran skeleton contextuel — remplace spinners / pages vides. */
export function VenextSkeletonScreen({
  variant = "dashboard",
  tall,
  testId = "venext-skeleton-screen",
}: VenextSkeletonScreenProps) {
  const inner = (() => {
    switch (variant) {
      case "wallet":
        return <VenextSkeletonWallet />;
      case "messaging":
        return <VenextSkeletonMessage />;
      case "catalog":
      case "product":
        return <VenextSkeletonProduct />;
      case "orders":
        return <VenextSkeletonOrder />;
      case "notifications":
        return <VenextSkeletonNotification />;
      case "pole":
        return <VenextSkeletonPole tall={tall} />;
      case "form":
        return <VenextSkeletonForm />;
      case "table":
        return <VenextSkeletonTable />;
      default:
        return <VenextSkeletonDashboard />;
    }
  })();

  return (
    <div className="venext-skeleton-screen" data-testid={testId} role="status" aria-label="Préparation de l'écran">
      {inner}
    </div>
  );
}
