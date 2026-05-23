"use client";

import { VenextSkeletonBase } from "commerce-ux-harmony";

export function DashboardSkeleton() {
  return (
    <div className="bo-skeleton-grid" data-testid="skeleton-dashboard">
      {Array.from({ length: 9 }).map((_, i) => (
        <VenextSkeletonBase key={i} height={88} radius="lg" className="bo-skeleton-tile" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bo-skeleton-table" data-testid="skeleton-table">
      <VenextSkeletonBase height={36} radius="md" />
      {Array.from({ length: rows }).map((_, i) => (
        <VenextSkeletonBase key={i} height={48} radius="sm" />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bo-skeleton-profile" data-testid="skeleton-profile">
      <VenextSkeletonBase height={120} radius="lg" />
      <VenextSkeletonBase height={200} radius="lg" />
      <VenextSkeletonBase height={160} radius="lg" />
    </div>
  );
}
