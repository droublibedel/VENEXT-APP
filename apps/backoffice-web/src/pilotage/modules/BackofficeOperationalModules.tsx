"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { pilotageFetch } from "@/lib/pilotage-api";
import { normalizeBackofficeEnvelope } from "@/pilotage/lib/envelope";
import { usePilotageDetail, usePilotageList } from "@/pilotage/hooks/usePilotageResource";
import { DataSourceBadge, PilotageListShell } from "@/pilotage/components/PilotageUi";

import { pilotageFrCi as t } from "../i18n/fr-ci";
import { DashboardSkeleton } from "../skeletons/BackofficeSkeletons";

type Dashboard = {
  activeUsers: number;
  registrationsInProgress: number;
  blockedJourneys: number;
  recentErrors: number;
  enterprisesToValidate: number;
  suspendedAccounts: number;
  securityAlerts: number;
  probableSupportQueue: number;
};

export function BackofficeDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    pilotageFetch<Dashboard>("/api/backoffice/dashboard")
      .then(setData)
      .catch(() => {
        setFailed(true);
        setData(null);
      });
  }, []);
  if (!data && !failed) return <DashboardSkeleton />;
  if (!data) {
    return (
      <PilotageListShell status="error" title={t.dashboard} onRetry={() => window.location.reload()}>
        <></>
      </PilotageListShell>
    );
  }
  const tiles = [
    { label: "Utilisateurs actifs", value: data.activeUsers, href: "/pilotage/users" },
    { label: "Inscriptions en cours", value: data.registrationsInProgress, href: "/pilotage/journeys" },
    { label: "Parcours bloqués", value: data.blockedJourneys, href: "/pilotage/journeys?status=BLOCKED" },
    { label: "Erreurs récentes", value: data.recentErrors, href: "/pilotage/errors" },
    { label: "Grands comptes à valider", value: data.enterprisesToValidate, href: "/pilotage/enterprises" },
    { label: "Comptes suspendus", value: data.suspendedAccounts, href: "/pilotage/users" },
    { label: "Alertes sécurité", value: data.securityAlerts, href: "/pilotage/enterprises" },
    { label: "Support à traiter", value: data.probableSupportQueue, href: "/pilotage/support" },
    { label: "Santé plateforme", value: "→", href: "/pilotage/health" },
  ];
  return (
    <section>
      <h1>{t.dashboard}</h1>
      <div className="bo-tiles">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="bo-tile">
            <span className="bo-tile-value">{tile.value}</span>
            <span className="bo-tile-label">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BackofficeUserErrorObservability() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/errors");
  return (
    <PilotageListShell
      status={status}
      title={t.errors}
      description="Incidents terrain remontés par les applications."
      envelope={envelope}
      emptyVariant="errors"
      error={error}
      onRetry={reload}
    >
      <table className="bo-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Utilisateur</th>
            <th>Message</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((e) => (
            <tr key={String(e.id)}>
              <td>{String(e.occurredAt).slice(0, 19)}</td>
              <td>
                <Link href={`/pilotage/errors/${e.id}`}>{e.errorType}</Link>
              </td>
              <td>{e.userPhone ?? e.userId ?? "—"}</td>
              <td>{e.userFacingMessage}</td>
              <td>{e.treatmentStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficeUserJourneyMonitor() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/journeys");
  return (
    <PilotageListShell
      status={status}
      title={t.journeys}
      description="Parcours utilisateurs en cours, bloqués ou abandonnés."
      envelope={envelope}
      emptyVariant="journeys"
      error={error}
      onRetry={reload}
    >
      <table className="bo-table">
        <thead>
          <tr>
            <th>Parcours</th>
            <th>Étape</th>
            <th>Statut</th>
            <th>Application</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((j) => (
            <tr key={String(j.journeyId)}>
              <td>
                <Link href={`/pilotage/journeys/${j.journeyId}`}>{j.journeyKey}</Link>
              </td>
              <td>{j.currentStep}</td>
              <td>{j.status}</td>
              <td>{j.application}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficeSupportDesk() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/support");
  return (
    <PilotageListShell status={status} title={t.support} envelope={envelope} error={error} onRetry={reload}>
      <table className="bo-table">
        <thead>
          <tr>
            <th>Priorité</th>
            <th>Titre</th>
            <th>Source</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((row) => (
            <tr key={String(row.id)}>
              <td>{row.priority}</td>
              <td>
                <Link href={`/pilotage/support/${row.id}`}>{row.title}</Link>
              </td>
              <td>{row.source}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficePlatformHealth() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    pilotageFetch<Record<string, unknown>>("/api/backoffice/health")
      .then((h) => {
        setHealth(h);
        setFailed(false);
      })
      .catch(() => {
        setHealth(null);
        setFailed(true);
      });
  }, []);
  if (!health && !failed) {
    return <PilotageListShell status="loading" title={t.health} skeleton="table"><></></PilotageListShell>;
  }
  if (!health) {
    return (
      <PilotageListShell status="error" title={t.health} onRetry={() => window.location.reload()}>
        <></>
      </PilotageListShell>
    );
  }
  const components = (health.components ?? {}) as Record<string, { status: string; latencyMs?: number; message?: string }>;
  return (
    <PilotageListShell status="ready" title={t.health} description="Probes réels BFF, core, base et sync gouvernance.">
      <p className="bo-muted">Dernière vérification : {String(health.checkedAt ?? "—")}</p>
      <ul className="bo-health-list">
        {Object.entries(components).map(([key, val]) => (
          <li key={key} className={`bo-health-${val.status}`}>
            <strong>{key}</strong> — {val.status}
            {val.latencyMs != null ? ` (${val.latencyMs} ms)` : ""}
            {val.message ? <span className="bo-muted"> — {val.message}</span> : null}
          </li>
        ))}
      </ul>
    </PilotageListShell>
  );
}

export function BackofficeFeatureFlagsCenter() {
  const [flags, setFlags] = useState<Array<{ key: string; enabled: boolean }>>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const reload = () => {
    setStatus("loading");
    pilotageFetch<unknown>("/api/backoffice/feature-flags")
      .then((raw) => {
        const env = normalizeBackofficeEnvelope<{ key: string; enabled: boolean }>(raw);
        setFlags(env.payload);
        setStatus(env.payload.length ? "ready" : "empty");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(() => {
    reload();
  }, []);
  return (
    <PilotageListShell status={status} title={t.flags} zone="governance" description="Contrôle stratégique des capacités plateforme." onRetry={reload}>
      <ul>
        {flags.map((f) => (
          <li key={f.key}>
            {f.key}: {f.enabled ? "ON" : "OFF"}
          </li>
        ))}
      </ul>
    </PilotageListShell>
  );
}

export function BackofficeInternalAuditLog() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/audit-log");
  return (
    <PilotageListShell status={status} title={t.audit} envelope={envelope} error={error} onRetry={reload}>
      <table className="bo-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Acteur</th>
            <th>Action</th>
            <th>Cible</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((a) => (
            <tr key={String(a.id)}>
              <td>{String(a.at).slice(0, 19)}</td>
              <td>{a.actorEmail}</td>
              <td>{a.action}</td>
              <td>{a.targetId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficeDocumentsCenter() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/documents");
  return (
    <PilotageListShell status={status} title={t.documents} envelope={envelope} error={error} onRetry={reload}>
      <ul>
        {payload.map((d) => (
          <li key={String(d.id)}>
            {d.title} — {d.kind}
          </li>
        ))}
      </ul>
    </PilotageListShell>
  );
}

export function BackofficeProductQualityCenter() {
  const [q, setQ] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    pilotageFetch<Record<string, unknown>>("/api/backoffice/product-quality")
      .then((row) => {
        setQ(row);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);
  return (
    <PilotageListShell status={status} title={t.quality} description="Indicateurs qualité produit et parcours.">
      {q ? (
        <>
          <p>Taux réussite parcours : {String(q.journeySuccessRate)} %</p>
          <p>Taux abandon (24h) : {String(q.abandonRate ?? 0)} %</p>
          <p>Parcours bloqués (24h) : {String(q.blockedJourneyRate ?? 0)} %</p>
          <p>Erreurs live (24h) : {String(q.liveErrorsCount ?? 0)}</p>
          {Array.isArray(q.appStability) ? (
            <table className="bo-table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Erreurs 24h</th>
                  <th>Bloqués</th>
                  <th>Stabilité</th>
                </tr>
              </thead>
              <tbody>
                {(q.appStability as { application: string; errorCount24h: number; blockedJourneys24h: number; stabilityScore: number }[]).map(
                  (row) => (
                    <tr key={row.application}>
                      <td>{row.application}</td>
                      <td>{row.errorCount24h}</td>
                      <td>{row.blockedJourneys24h}</td>
                      <td>{row.stabilityScore}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          ) : null}
          {Array.isArray(q.moduleHeatmap) && (q.moduleHeatmap as { module: string; count: number }[]).length > 0 ? (
            <>
              <h3>Heatmap modules</h3>
              <ul>
                {(q.moduleHeatmap as { module: string; count: number }[]).map((m) => (
                  <li key={m.module}>
                    {m.module} — {m.count} erreurs
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </PilotageListShell>
  );
}

export function BackofficeEnterpriseGovernanceCenter() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, unknown>>("/api/backoffice/enterprises");
  return (
    <PilotageListShell
      status={status}
      title={t.enterprises}
      description="Grands comptes — gouvernance commerciale."
      envelope={envelope}
      error={error}
      onRetry={reload}
    >
      <div className="bo-enterprise-grid">
        {payload.map((e) => (
          <article key={String(e.id)} className="bo-card">
            <Link href={`/pilotage/enterprises/${e.id}`} className="bo-card-btn">
              <h2>{String(e.name)}</h2>
              <p>Canal : {String(e.channelStatus)}</p>
              <p>Pôles : {Array.isArray(e.polesActivated) ? (e.polesActivated as string[]).join(", ") : "—"}</p>
              <p>Alertes : {String(e.securityAlerts ?? 0)}</p>
            </Link>
          </article>
        ))}
      </div>
    </PilotageListShell>
  );
}

export function BackofficeSmallAccountsCenter() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string>>("/api/backoffice/users");
  return (
    <PilotageListShell status={status} title={t.users} envelope={envelope} error={error} onRetry={reload}>
      <table className="bo-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Acteur</th>
            <th>Téléphone</th>
            <th>Wallet</th>
            <th>Sécurité</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((u) => (
            <tr key={String(u.id)}>
              <td>
                <Link href={`/pilotage/users/${u.id}`}>{u.fullName}</Link>
              </td>
              <td>{u.actorRole}</td>
              <td>{u.phone}</td>
              <td>{u.walletStatus ?? "—"}</td>
              <td>{u.securityStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficeAppObservability() {
  const { status, payload, envelope, error, reload } = usePilotageList<Record<string, string | number>>(
    "/api/backoffice/app-observability",
  );
  return (
    <PilotageListShell
      status={status}
      title={t.apps}
      description="Observabilité live par application (erreurs 24h, parcours bloqués)."
      envelope={envelope}
      error={error}
      onRetry={reload}
    >
      <table className="bo-table">
        <thead>
          <tr>
            <th>App</th>
            <th>Erreurs 24h</th>
            <th>Parcours bloqués</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((row) => (
            <tr key={String(row.application)}>
              <td>{row.application}</td>
              <td>{row.errorCount24h}</td>
              <td>{row.blockedJourneys24h}</td>
              <td>{row.version ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PilotageListShell>
  );
}

export function BackofficeGlobalSearch() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const path = submitted.trim() ? `/api/backoffice/search?q=${encodeURIComponent(submitted)}` : null;
  const { status, payload, envelope, error, reload } = usePilotageList<{ label: string; href: string; kind: string }>(
    path,
    [submitted],
  );
  const displayStatus = !submitted.trim() ? "empty" : status;
  return (
    <section>
      <h1>{t.search}</h1>
      <p className="bo-muted">Utilisateurs, entreprises, erreurs, parcours, support.</p>
      <div className="bo-search-bar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, téléphone, entreprise…"
          className="bo-search-input"
          onKeyDown={(e) => e.key === "Enter" && setSubmitted(q)}
        />
        <button type="button" className="bo-form button" onClick={() => setSubmitted(q)}>
          Rechercher
        </button>
      </div>
      <DataSourceBadge envelope={envelope} />
      {displayStatus === "empty" && !submitted.trim() ? (
        <p className="bo-muted bo-search-hint">Saisissez un terme puis lancez la recherche.</p>
      ) : (
        <PilotageListShell
          status={displayStatus}
          title=""
          emptyVariant="filter"
          error={error}
          onRetry={reload}
        >
          <ul className="bo-search-results">
            {payload.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>
                  [{r.kind}] {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </PilotageListShell>
      )}
    </section>
  );
}

export function BackofficeErrorDetail({ id }: { id: string }) {
  const { status, data, error, reload } = usePilotageDetail<Record<string, unknown>>(`/api/backoffice/errors/${id}`);
  return (
    <PilotageListShell status={status} title="Fiche erreur" error={error} onRetry={reload} skeleton="profile">
      {data ? (
        <div className="bo-detail">
          <p>
            <strong>Message :</strong> {String(data.userFacingMessage)}
          </p>
          <p>
            <strong>Type :</strong> {String(data.errorType)}
          </p>
          <p>
            <strong>App :</strong> {String(data.application)}
          </p>
          <p>
            <strong>Écran :</strong> {String(data.screen ?? "—")}
          </p>
          <p>
            <strong>Route :</strong> {String(data.routeOrApi ?? "—")}
          </p>
          <p>
            <strong>Module :</strong> {String(data.module ?? "—")}
          </p>
          <p>
            <strong>Parcours lié :</strong> {String(data.journeyId ?? "—")}
          </p>
          <Link href="/pilotage/errors">← Retour liste</Link>
        </div>
      ) : null}
    </PilotageListShell>
  );
}

export function BackofficeJourneyDetail({ id }: { id: string }) {
  const { status, data, error, reload } = usePilotageDetail<Record<string, unknown>>(`/api/backoffice/journeys/${id}`);
  return (
    <PilotageListShell status={status} title="Fiche parcours" error={error} onRetry={reload} skeleton="profile">
      {data ? (
        <div className="bo-detail">
          <p>
            <strong>Clé :</strong> {String(data.journeyKey)}
          </p>
          <p>
            <strong>Étape :</strong> {String(data.currentStep)}
          </p>
          <p>
            <strong>Statut :</strong> {String(data.status)}
          </p>
          <p>
            <strong>Retries :</strong> {String(data.retryCount ?? 0)}
          </p>
          <p>
            <strong>Blocage :</strong> {String(data.failureReason ?? "—")}
          </p>
          <Link href="/pilotage/journeys">← Retour liste</Link>
        </div>
      ) : null}
    </PilotageListShell>
  );
}

export function BackofficeUserDetail({ id }: { id: string }) {
  const { status, data, error, reload } = usePilotageDetail<Record<string, unknown>>(`/api/backoffice/users/${id}`);
  const user = (data?.user ?? {}) as Record<string, string>;
  const errors = (data?.errors ?? []) as Array<Record<string, string>>;
  const journeys = (data?.journeys ?? []) as Array<Record<string, string>>;
  return (
    <PilotageListShell status={status} title="Fiche utilisateur" error={error} onRetry={reload} skeleton="profile">
      {data ? (
        <div className="bo-detail">
          <h2>{user.fullName}</h2>
          <p>
            {user.actorRole} · {user.phone}
          </p>
          <h3>Erreurs récentes ({errors.length})</h3>
          <ul>
            {errors.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link href={`/pilotage/errors/${e.id}`}>{e.errorType}</Link>
              </li>
            ))}
          </ul>
          <h3>Parcours ({journeys.length})</h3>
          <ul>
            {journeys.slice(0, 5).map((j) => (
              <li key={j.journeyId}>
                <Link href={`/pilotage/journeys/${j.journeyId}`}>{j.journeyKey}</Link> — {j.status}
              </li>
            ))}
          </ul>
          <Link href="/pilotage/users">← Retour liste</Link>
        </div>
      ) : null}
    </PilotageListShell>
  );
}

export function BackofficeSupportDetail({ id }: { id: string }) {
  const { status, data, error, reload } = usePilotageDetail<Record<string, unknown>>(`/api/backoffice/support/${id}`);
  return (
    <PilotageListShell status={status} title="Ticket support" error={error} onRetry={reload} skeleton="profile">
      {data ? (
        <div className="bo-detail">
          <h2>{String(data.title)}</h2>
          <p>
            Priorité {String(data.priority)} · {String(data.status)}
          </p>
          <p>{String(data.summary ?? "")}</p>
          <p className="bo-muted">Assigné : {String(data.assignee ?? "Non assigné")}</p>
          <Link href="/pilotage/support">← Retour file</Link>
        </div>
      ) : null}
    </PilotageListShell>
  );
}

export function BackofficeEnterpriseDetail({ id }: { id: string }) {
  const { status, data, error, reload } = usePilotageDetail<Record<string, unknown>>(`/api/backoffice/enterprises/${id}`);
  const enterprise = (data?.enterprise ?? data) as Record<string, unknown>;
  return (
    <PilotageListShell status={status} title="Fiche entreprise" error={error} onRetry={reload} skeleton="profile">
      {data ? (
        <div className="bo-detail">
          <h2>{String(enterprise.name ?? enterprise.companyName ?? id)}</h2>
          <h3>Pôles & invitations</h3>
          <p className="bo-muted">Timeline et alertes gouvernance ci-dessous.</p>
          <ul>
            {((data.governanceTimeline as Array<Record<string, string>>) ?? []).slice(0, 8).map((ev) => (
              <li key={ev.id}>
                {ev.title} — {ev.detail}
              </li>
            ))}
          </ul>
          <h3>Alertes sécurité</h3>
          <ul>
            {((data.securityAlerts as Array<Record<string, string>>) ?? []).map((a, i) => (
              <li key={i}>
                {a.alertType}: {a.message}
              </li>
            ))}
          </ul>
          <Link href="/pilotage/enterprises">← Retour liste</Link>
        </div>
      ) : null}
    </PilotageListShell>
  );
}
