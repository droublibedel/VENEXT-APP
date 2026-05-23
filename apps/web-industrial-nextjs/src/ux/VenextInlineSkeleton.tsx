import { VenextSkeletonScreen, type VenextSkeletonScreenVariant } from "commerce-ux-harmony";

export function VenextInlineSkeleton({
  variant = "pole",
  tall,
  className = "px-4 py-6",
}: {
  variant?: VenextSkeletonScreenVariant;
  tall?: boolean;
  className?: string;
}) {
  return (
    <div className={className} data-testid="venext-inline-skeleton">
      <VenextSkeletonScreen variant={variant} tall={tall} />
    </div>
  );
}
