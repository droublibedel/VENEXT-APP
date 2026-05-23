"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { IndustrialCommerceErrorBoundary } from "commerce-humanized-errors";

export default function PolesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IndustrialCommerceErrorBoundary locale="fr-CI" module="industrial-poles">
      <div className="min-h-dvh bg-slate-950 text-slate-100 antialiased">{children}</div>
    </IndustrialCommerceErrorBoundary>
  );
}
