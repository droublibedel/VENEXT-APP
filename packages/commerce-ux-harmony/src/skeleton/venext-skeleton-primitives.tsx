import { VenextSkeletonBase } from "./VenextSkeletonBase";

export type SkeletonLinesProps = {
  lines?: number;
  lastLineWidth?: string;
  testId?: string;
};

export function SkeletonLines({ lines = 3, lastLineWidth = "72%", testId }: SkeletonLinesProps) {
  return (
    <div className="venext-skeleton-lines" data-testid={testId ?? "venext-skeleton-lines"} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <VenextSkeletonBase
          key={i}
          height={i === 0 ? 14 : 12}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          radius="sm"
          testId={`venext-skeleton-line-${i}`}
        />
      ))}
    </div>
  );
}

export type SkeletonAvatarProps = { size?: number; testId?: string };

export function SkeletonAvatar({ size = 40, testId }: SkeletonAvatarProps) {
  return <VenextSkeletonBase circle width={size} height={size} testId={testId ?? "venext-skeleton-avatar"} />;
}
