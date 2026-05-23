"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { BackofficeLightweightEnvelope, BackofficeResolvedState } from "@/pilotage/lib/envelope";
import { DashboardSkeleton, ProfileSkeleton, TableSkeleton } from "../skeletons/BackofficeSkeletons";

export function PilotageContextHeader({
  zone,
  title,
  description,
}: {
  zone: "pilotage" | "governance";
  title: string;
  description?: string;
}) {
  return (
    <header className="bo-context-header">
      <span className={`bo-zone-badge bo-zone-${zone}`}>
        {zone === "pilotage" ? "Pilotage opérationnel" : "Gouvernance"}
      </span>
      <h1>{title}</h1>
      {description ? <p className="bo-muted">{description}</p> : null}
    </header>
  );
}

export function DataSourceBadge({
  envelope,
}: {
  envelope?: Pick<BackofficeLightweightEnvelope<unknown>, "dataSource" | "fallbackUsed" | "persistenceMode">;
}) {
  if (!envelope?.dataSource) return null;
  const isFallback = envelope.dataSource === "FALLBACK" || envelope.fallbackUsed;
  return (
    <p className={`bo-source-badge ${isFallback ? "bo-source-fallback" : "bo-source-live"}`}>
      {isFallback ? "Données locales de secours" : `Source ${envelope.dataSource}`}
      {envelope.persistenceMode ? ` · ${envelope.persistenceMode}` : ""}
    </p>
  );
}

type EmptyVariant = "default" | "clean" | "filter" | "errors" | "journeys";

const EMPTY_COPY: Record<EmptyVariant, { title: string; body: string }> = {
  default: {
    title: "Rien à afficher pour le moment",
    body: "Les données apparaîtront dès qu'une activité terrain sera détectée.",
  },
  clean: { title: "Tout est calme", body: "Aucun incident signalé sur cette vue — c'est une bonne nouvelle." },
  filter: { title: "Aucun résultat pour ce filtre", body: "Élargissez les critères ou revenez au tableau de bord." },
  errors: { title: "Aucune erreur récente", body: "Les applications fonctionnent normalement sur cette période." },
  journeys: { title: "Aucun parcours en cours", body: "Les parcours utilisateurs s'afficheront ici en temps réel." },
};

export function PilotageEmptyState({ variant = "default", action }: { variant?: EmptyVariant; action?: ReactNode }) {
  const copy = EMPTY_COPY[variant];
  return (
    <div className="bo-empty-state">
      <h2>{copy.title}</h2>
      <p className="bo-muted">{copy.body}</p>
      {action}
    </div>
  );
}

export function PilotageErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bo-empty-state bo-empty-error">
      <h2>Données indisponibles</h2>
      <p className="bo-muted">{message}</p>
      {onRetry ? (
        <button type="button" className="bo-form button" onClick={onRetry}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function PilotageListShell<T>({
  status,
  title,
  zone = "pilotage",
  description,
  envelope,
  emptyVariant = "default",
  skeleton = "table",
  children,
  onRetry,
  error,
}: {
  status: BackofficeResolvedState;
  title: string;
  zone?: "pilotage" | "governance";
  description?: string;
  envelope?: BackofficeLightweightEnvelope<T>;
  emptyVariant?: EmptyVariant;
  skeleton?: "table" | "profile" | "dashboard";
  children: ReactNode;
  onRetry?: () => void;
  error?: string;
}) {
  if (status === "loading") {
    if (skeleton === "dashboard") return <DashboardSkeleton />;
    if (skeleton === "profile") return <ProfileSkeleton />;
    return <TableSkeleton />;
  }
  if (status === "error") {
    return (
      <section>
        <PilotageContextHeader zone={zone} title={title} description={description} />
        <PilotageErrorState message={error ?? "Erreur de chargement"} onRetry={onRetry} />
      </section>
    );
  }
  if (status === "empty") {
    return (
      <section>
        <PilotageContextHeader zone={zone} title={title} description={description} />
        <DataSourceBadge envelope={envelope} />
        <PilotageEmptyState variant={emptyVariant} action={<Link href="/pilotage">Tableau de bord</Link>} />
      </section>
    );
  }
  return (
    <section>
      <PilotageContextHeader zone={zone} title={title} description={description} />
      <DataSourceBadge envelope={envelope} />
      {children}
    </section>
  );
}
