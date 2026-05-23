"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { DEMO_SPONSORED_ACTOR, DEMO_SPONSORED_CAMPAIGN_ID, venextActorHeaders } from "@/commerce-messaging/constants";

type EvaluatePayload = {
  eligible?: boolean;
  reasons?: string[];
  campaign?: {
    id: string;
    product?: { id: string; name?: string | null; category?: string | null };
    sponsorPublic?: { displayName?: string | null; country?: string | null; city?: string | null };
    discoverySource?: string | null;
    regionScope?: string | null;
    cityScope?: string | null;
  } | null;
  catalogAccessLevel?: string;
  relationshipRequiredForOrders?: boolean;
};

type OpenPayload = {
  window?: { id: string; expiresAt?: string; state?: string };
  thread?: { id: string };
  diagnostics?: { sponsoredWindowExpiresAt?: string; handshakeState?: string };
  existingWindowReused?: boolean;
};

export default function SponsoredDiscoveryPage() {
  const [surface, setSurface] = useState<EvaluatePayload | null>(null);
  const [evaluateJson, setEvaluateJson] = useState<EvaluatePayload | null>(null);
  const [openResult, setOpenResult] = useState<OpenPayload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [relNote, setRelNote] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...venextActorHeaders(DEMO_SPONSORED_ACTOR),
    }),
    [],
  );

  const runSurface = useCallback(async () => {
    setBusy("surface");
    setSurface(null);
    try {
      const r = await fetch(`/api/core/v1/sponsored-discovery/campaign-product-surface/${DEMO_SPONSORED_CAMPAIGN_ID}`, {
        method: "GET",
        headers: venextActorHeaders(DEMO_SPONSORED_ACTOR),
      });
      const j = (await r.json()) as EvaluatePayload;
      setSurface(j);
    } finally {
      setBusy(null);
    }
  }, []);

  const runEvaluate = useCallback(async () => {
    setBusy("evaluate");
    setEvaluateJson(null);
    try {
      const r = await fetch("/api/core/v1/sponsored-discovery/evaluate", {
        method: "POST",
        headers,
        body: JSON.stringify({ campaignId: DEMO_SPONSORED_CAMPAIGN_ID }),
      });
      const j = (await r.json()) as EvaluatePayload;
      setEvaluateJson(j);
    } finally {
      setBusy(null);
    }
  }, [headers]);

  const runOpen = useCallback(async () => {
    setBusy("open");
    setOpenResult(null);
    setRelNote(null);
    try {
      const r = await fetch("/api/core/v1/sponsored-discovery/open", {
        method: "POST",
        headers,
        body: JSON.stringify({ campaignId: DEMO_SPONSORED_CAMPAIGN_ID }),
      });
      const j = (await r.json()) as OpenPayload;
      setOpenResult(j);
    } finally {
      setBusy(null);
    }
  }, [headers]);

  const runRelationshipRequest = useCallback(async () => {
    const windowId = openResult?.window?.id;
    if (!windowId) return;
    setBusy("relationship");
    setRelNote(null);
    try {
      const r = await fetch("/api/core/v1/sponsored-discovery/relationship-request", {
        method: "POST",
        headers,
        body: JSON.stringify({ windowId, motivation: "Alignement commercial souhaité après fenêtre sponsorisée." }),
      });
      const t = await r.text();
      setRelNote(t);
    } finally {
      setBusy(null);
    }
  }, [headers, openResult?.window?.id]);

  const campaign = surface?.campaign ?? evaluateJson?.campaign;
  const expiresAt =
    openResult?.diagnostics?.sponsoredWindowExpiresAt ?? openResult?.window?.expiresAt ?? null;

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/90">Découverte sponsorisée</p>
      <h1 className="mt-2 text-xl font-semibold">Conversation sponsorisée temporaire</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-400">
        Ouverture commerciale contextualisée : ce fil ne donne pas accès au catalogue complet du sponsor, ni au réseau
        partenaires. Une relation commerciale acceptée reste requise pour les commandes relationnelles normales.
      </p>
      <ul className="mt-4 list-inside list-disc space-y-1 text-[11px] text-slate-500">
        <li>Placement économique contrôlé — pas de place de marché ouverte.</li>
        <li>Commande relationnelle normale impossible sans relation acceptée.</li>
        <li>Pas d’achat immédiat : pas de tunnel d’achat express.</li>
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runSurface()}
          className="rounded border border-slate-600/60 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-100 hover:bg-slate-800/80 disabled:opacity-40"
        >
          Surface produit (GET, sans bump analytics)
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runEvaluate()}
          className="rounded border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-50 hover:bg-amber-950/50 disabled:opacity-40"
        >
          Évaluer éligibilité
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runOpen()}
          className="rounded border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-[11px] text-cyan-50 hover:bg-cyan-950/50 disabled:opacity-40"
        >
          Ouvrir fenêtre / fil
        </button>
        <button
          type="button"
          disabled={busy !== null || !openResult?.window?.id}
          onClick={() => void runRelationshipRequest()}
          className="rounded border border-violet-700/50 bg-violet-950/30 px-3 py-2 text-[11px] text-violet-100 hover:bg-violet-950/50 disabled:opacity-40"
        >
          Demander une relation commerciale
        </button>
      </div>

      {campaign ? (
        <section className="mt-8 rounded border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contexte sponsorisé</h2>
          <dl className="mt-3 grid gap-2 text-[12px] text-slate-300 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Produit</dt>
              <dd className="font-medium text-slate-100">{campaign.product?.name ?? "—"}</dd>
              <dd className="text-[10px] text-slate-500">{campaign.product?.category ?? ""}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sponsor (identité minimale)</dt>
              <dd className="font-medium">{campaign.sponsorPublic?.displayName ?? "—"}</dd>
              <dd className="text-[10px] text-slate-500">
                {[campaign.sponsorPublic?.country, campaign.sponsorPublic?.city].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Zone ciblée</dt>
              <dd>
                {campaign.regionScope ?? "—"}
                {campaign.cityScope ? ` · ${campaign.cityScope}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Pourquoi ce produit apparaît</dt>
              <dd className="text-slate-400">{campaign.discoverySource ?? "INTELLIGENCE_PLACEMENT"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Accès catalogue</dt>
              <dd className="text-amber-200/90">{surface?.catalogAccessLevel ?? "RESTREINT"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Commandes relationnelles</dt>
              <dd className="text-cyan-200/90">
                {surface?.relationshipRequiredForOrders !== false ? "Relation acceptée requise" : "—"}
              </dd>
            </div>
            {expiresAt ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Fin de fenêtre (UTC)</dt>
                <dd className="font-mono text-[11px] text-slate-300">{expiresAt}</dd>
              </div>
            ) : null}
            {openResult?.diagnostics?.handshakeState ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">État handshake</dt>
                <dd className="font-mono text-[11px]">{openResult.diagnostics.handshakeState}</dd>
              </div>
            ) : null}
            {openResult?.existingWindowReused ? (
              <div className="sm:col-span-2 text-[11px] text-amber-200/80">
                Fenêtre existante réutilisée (anti-double ouverture).
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {surface && !surface.eligible ? (
        <p className="mt-4 rounded border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-100">
          Surface : non éligible — {(surface.reasons ?? []).join(", ") || "raisons indisponibles"}
        </p>
      ) : null}

      {evaluateJson && !evaluateJson.eligible ? (
        <p className="mt-2 rounded border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-100">
          Évaluation : non éligible — {(evaluateJson.reasons ?? []).join(", ")}
        </p>
      ) : null}

      {openResult?.thread?.id ? (
        <p className="mt-4 text-[11px] text-slate-500">
          Fil créé :{" "}
          <Link className="text-cyan-400 hover:underline" href={`/commerce-messaging/${openResult.thread.id}`}>
            ouvrir dans la messagerie commerce
          </Link>
        </p>
      ) : null}

      {relNote ? (
        <section className="mt-4 rounded border border-violet-900/40 bg-violet-950/20 p-3">
          <h3 className="text-xs font-semibold text-violet-200">Réponse demande de relation</h3>
          <pre className="mt-2 max-h-40 overflow-auto text-[10px] text-slate-400">{relNote}</pre>
        </section>
      ) : null}

      <details className="mt-8 rounded border border-slate-800 bg-slate-900/30 p-3">
        <summary className="cursor-pointer text-[11px] text-slate-500">Diagnostics bruts (optionnel)</summary>
        <pre className="mt-2 max-h-48 overflow-auto text-[10px] text-slate-500">
          {JSON.stringify({ surface, evaluateJson, openResult }, null, 2)}
        </pre>
      </details>

      <p className="mt-6 text-[10px] text-slate-600">
        Acteur démo : {DEMO_SPONSORED_ACTOR.organizationId.slice(0, 8)}… · Campagne :{" "}
        <span className="font-mono">{DEMO_SPONSORED_CAMPAIGN_ID}</span>
      </p>
      <Link className="mt-4 inline-block text-sm text-cyan-400 hover:underline" href="/commerce-messaging">
        Retour hub messagerie
      </Link>
    </div>
  );
}
