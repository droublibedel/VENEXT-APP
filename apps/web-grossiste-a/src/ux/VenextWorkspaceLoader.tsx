import { VenextSkeletonScreen } from "commerce-ux-harmony";

export type VenextWorkspaceLoaderProps = {
  variant?: "dashboard" | "wallet" | "messaging" | "catalog" | "orders" | "pole" | "table";
};

export function VenextWorkspaceLoader({ variant = "dashboard" }: VenextWorkspaceLoaderProps) {
  return (
    <div style={{ padding: 24, minHeight: 280 }}>
      <VenextSkeletonScreen variant={variant} />
    </div>
  );
}
