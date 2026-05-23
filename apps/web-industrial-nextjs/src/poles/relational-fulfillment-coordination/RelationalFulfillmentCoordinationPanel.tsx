"use client";

import { useCallback, useEffect, useState } from "react";
import type { RelationalFulfillmentTaskDto, RelationalFulfillmentTaskListResponseDto } from "@venext/shared-contracts";

import { fetchFulfillmentTasks, postBlockTask, postCompleteTask, postCreateTask, postStartTask } from "./coordination-api";

const FORBIDDEN_WORDS = ["ticket", "customer support", "parcel", "delivery tracking", "SAV"];

export function RelationalFulfillmentCoordinationPanel(props: {
  organizationId: string | null;
  recordId: string | null;
  coordinationEnabled: boolean;
  onRefresh: () => void;
}) {
  const { organizationId, recordId, coordinationEnabled, onRefresh } = props;
  const [data, setData] = useState<RelationalFulfillmentTaskListResponseDto | null>(null);
  const [title, setTitle] = useState("Coordination réception corridor");
  const [description, setDescription] = useState("Alignement opérationnel inter-partenaires");
  const [blocking, setBlocking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !recordId || !coordinationEnabled) return;
    void fetchFulfillmentTasks(organizationId, recordId).then((r) => {
      if (r.ok) setData(r.data);
    });
  }, [organizationId, recordId, coordinationEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!coordinationEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="fulfillment-coordination-disabled">
        Coordination opérationnelle désactivée (
        <span className="font-mono">relational_fulfillment_coordination_enabled</span>).
      </p>
    );
  }

  const blockingTasks = (data?.tasks ?? []).filter((t) => t.blockingFulfillment && t.taskStatus !== "COMPLETED" && t.taskStatus !== "CANCELLED");

  const run = async (key: string, fn: () => Promise<{ ok: boolean }>) => {
    setMessage(null);
    const res = await fn();
    if (res.ok) {
      setMessage("Coordination enregistrée.");
      reload();
      onRefresh();
    } else {
      setMessage("Action coordination refusée ou réponse invalide.");
    }
  };

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-coordination">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Coordination opérationnelle corridor</p>
      <p className="mt-1 text-[9px] text-slate-500">
        Tâches inter-entreprises — responsabilités, délais, blocages — pas outil SAV marketplace.
      </p>

      {blockingTasks.length > 0 ? (
        <p className="mt-2 text-[9px] text-amber-200/90" data-testid="coordination-blocking-tasks-alert">
          {blockingTasks.length} tâche(s) bloquante(s) ouverte(s) — clôture fulfillment impossible tant qu&apos;elles ne sont pas terminées.
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Créer tâche opérationnelle</p>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[9px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="coordination-task-title"
        />
        <textarea
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[9px]"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="mt-1 flex items-center gap-2 text-[9px] text-slate-400">
          <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
          Bloque clôture fulfillment
        </label>
        <button
          type="button"
          className="mt-1 rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
          disabled={!organizationId || !recordId}
          data-testid="coordination-create-task"
          onClick={() =>
            void run("create", () =>
              postCreateTask(organizationId!, recordId!, {
                taskType: "RECEPTION_COORDINATION",
                title,
                description,
                blockingFulfillment: blocking,
              }),
            )
          }
        >
          Créer tâche corridor
        </button>
      </div>

      <ul className="mt-3 space-y-2" data-testid="coordination-task-list">
        {(data?.tasks ?? []).map((t: RelationalFulfillmentTaskDto) => (
          <li key={t.id} className="rounded border border-slate-700/60 px-2 py-1 text-[9px] text-slate-300">
            <span className="font-mono text-cyan-100/90">{t.taskType}</span> · {t.title} ·{" "}
            <span className="font-mono">{t.taskStatus}</span>
            {t.blockingFulfillment ? <span className="text-amber-300"> · bloquant</span> : null}
            <div className="mt-1 flex flex-wrap gap-1">
              <button
                type="button"
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[8px]"
                onClick={() => void run("start", () => postStartTask(organizationId!, t.id))}
              >
                Démarrer
              </button>
              <button
                type="button"
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[8px]"
                onClick={() => void run("complete", () => postCompleteTask(organizationId!, t.id))}
              >
                Terminer
              </button>
              <button
                type="button"
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[8px]"
                onClick={() => void run("block", () => postBlockTask(organizationId!, t.id))}
              >
                Bloquer
              </button>
            </div>
          </li>
        ))}
      </ul>

      {message ? <p className="mt-2 text-[9px] text-slate-400">{message}</p> : null}
      <p className="mt-2 text-[8px] text-slate-600" data-testid="coordination-wording-guard">
        Wording interdit : {FORBIDDEN_WORDS.join(", ")}
      </p>
    </section>
  );
}
