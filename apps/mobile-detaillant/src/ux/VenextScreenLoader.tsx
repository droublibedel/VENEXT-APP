import { VenextSkeletonScreen } from "commerce-ux-harmony";

export type VenextScreenLoaderProps = {
  variant?: "dashboard" | "wallet" | "messaging" | "catalog" | "orders" | "notifications" | "form";
};

export function VenextScreenLoader({ variant = "dashboard" }: VenextScreenLoaderProps) {
  return (
    <div style={{ padding: 16, minHeight: 200 }}>
      <VenextSkeletonScreen variant={variant} />
    </div>
  );
}
