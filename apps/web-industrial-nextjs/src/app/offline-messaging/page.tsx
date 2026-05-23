"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { listOutbound } from "@/commerce-messaging/offline/outbound-queue";
import { DEMO_ACTOR, venextActorHeaders } from "@/commerce-messaging/constants";

export default function OfflineMessagingPage() {
  const [serverPending, setServerPending] = useState<unknown>(null);
  const [local, setLocal] = useState(() => listOutbound());

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/core/v1/offline-message-sync/pending", {
        headers: venextActorHeaders(DEMO_ACTOR),
      });
      if (r.ok) setServerPending(await r.json());
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">offline-messaging</p>
      <h1 className="mt-2 text-xl font-semibold">File sortante & synchronisation</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        File locale (localStorage) pour optimistic UI + endpoint noyau{" "}
        <span className="font-mono text-slate-300">GET /api/core/v1/offline-message-sync/pending</span> pour les
        messages marqués côté serveur.
      </p>
      <section className="mt-6 rounded border border-slate-800 bg-slate-900/50 p-3">
        <h2 className="text-xs font-semibold uppercase text-slate-500">Serveur (pending)</h2>
        <pre className="mt-2 max-h-48 overflow-auto text-[10px] text-slate-400">
          {JSON.stringify(serverPending, null, 2)}
        </pre>
      </section>
      <section className="mt-4 rounded border border-slate-800 bg-slate-900/50 p-3">
        <h2 className="text-xs font-semibold uppercase text-slate-500">Navigateur (queue locale)</h2>
        <pre className="mt-2 max-h-48 overflow-auto text-[10px] text-slate-400">
          {JSON.stringify(local, null, 2)}
        </pre>
        <button
          type="button"
          className="mt-2 text-[11px] text-cyan-400 hover:underline"
          onClick={() => setLocal(listOutbound())}
        >
          Rafraîchir
        </button>
      </section>
      <Link className="mt-6 inline-block text-sm text-cyan-400 hover:underline" href="/commerce-messaging">
        Retour hub
      </Link>
    </div>
  );
}
