"use client";

import type { ReactNode } from "react";

export function ProducerDashboardGrid(props: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  testId?: string;
}) {
  const { children, columns = 4, testId } = props;
  const colClass =
    columns === 2
      ? "lg:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-2 lg:grid-cols-3"
        : "md:grid-cols-2 producer-industrial-main-grid xl:grid-cols-4";

  return (
    <div className={`grid gap-3 ${colClass}`} data-testid={testId}>
      {children}
    </div>
  );
}
