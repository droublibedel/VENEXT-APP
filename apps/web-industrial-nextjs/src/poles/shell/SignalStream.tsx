"use client";

import type { OperationalSignalItem } from "../types";

import {
  classifyEconomicCommandStreamItem,
  ECONOMIC_COMMAND_REALTIME_CLASS_LABELS,
} from "../economic-command/economic-command-realtime-classification";
import {
  classifyIndustrialSituationRoomStreamItem,
  INDUSTRIAL_SITUATION_ROOM_REALTIME_CLASS_LABELS,
} from "../industrial-situation-room/industrial-situation-room-realtime-classification";
import {
  classifyIndustrialOperationalContinuityStreamItem,
  INDUSTRIAL_OPERATIONAL_CONTINUITY_REALTIME_CLASS_LABELS,
} from "../industrial-operational-continuity/industrial-operational-continuity-realtime-classification";
import {
  classifyIndustrialEvidenceStreamItem,
  INDUSTRIAL_EVIDENCE_REALTIME_CLASS_LABELS,
} from "../industrial-evidence/industrial-evidence-realtime-classification";
import {
  classifyCommercialRelationshipGraphStreamItem,
  COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS,
} from "../commercial-relationship-graph/commercial-relationship-graph-realtime-classification";
import {
  classifyRelationalCatalogStreamItem,
  RELATIONAL_CATALOG_REALTIME_CLASS_LABELS,
} from "../relational-catalog/relational-catalog-realtime-classification";
import {
  classifyRelationalOrdersStreamItem,
  RELATIONAL_ORDERS_REALTIME_CLASS_LABELS,
} from "../relational-orders/relational-orders-realtime-classification";

type Props = {
  items: OperationalSignalItem[];
  /** When true, stream is from a `demo.*` gateway channel (Instruction 9B). */
  demoMode?: boolean;
  /** Active WS channel label when session exposes it (Instruction 11A). */
  liveChannel?: string;
};

const VISIBLE_CAP = 40;

/** Live operational ticker — scroll container (Instruction 5 §2D / §9). */
export function SignalStream({ items, demoMode, liveChannel }: Props) {
  const visible = items.slice(0, VISIBLE_CAP);
  const trimmed = items.length - visible.length;

  return (
    <section className="mx-2 mb-2 max-h-[28vh] min-h-[120px] overflow-hidden rounded-md border border-slate-800 bg-black/55 md:mx-3 md:mb-3 md:max-h-[22vh]">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Signal stream
          {demoMode ? (
            <span className="ml-2 rounded bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-normal normal-case tracking-normal text-amber-200/90">
              demo
            </span>
          ) : (
            <span className="ml-2 rounded bg-emerald-950/70 px-1.5 py-0.5 text-[9px] font-normal normal-case tracking-normal text-emerald-200/90">
              live
            </span>
          )}
          {liveChannel ? (
            <span className="ml-2 font-mono text-[9px] font-normal normal-case tracking-normal text-slate-500">
              {liveChannel}
            </span>
          ) : null}
        </span>
        <span className="text-[10px] text-slate-500">
          {items.length} events
          {trimmed > 0 ? ` · showing ${VISIBLE_CAP}` : ""}
        </span>
      </div>
      <div className="h-[calc(100%-2rem)] overflow-y-auto overscroll-contain px-2 py-1">
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-slate-500">
            Listening for operational batches…
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 pb-2">
            {visible.map((ev) => (
              <li
                key={ev.id}
                className="rounded border border-slate-800/80 bg-slate-950/80 px-2 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">
                    {ev.priority}
                  </span>
                  <span className="text-[9px] text-slate-500">{ev.ts.slice(11, 19)}</span>
                </div>
                {(() => {
                  const env =
                    ev.commercialEnvelope ??
                    ev.marketingEnvelope ??
                    ev.orderAdvEnvelope ??
                    ev.supplyLogisticsEnvelope ??
                    ev.financeCollectionsEnvelope ??
                    ev.dataIntelligenceEnvelope ??
                    ev.economicMemoryEnvelope ??
                    ev.economicScenariosEnvelope ??
                    ev.economicCoordinationEnvelope ??
                    ev.economicCommandEnvelope ??
                    ev.industrialSituationRoomEnvelope ??
                    ev.industrialOperationalContinuityEnvelope ??
                    ev.industrialEvidenceEnvelope ??
                    ev.commercialRelationshipGraphEnvelope ??
                    ev.relationalCatalogEnvelope ??
                    ev.relationalOrdersEnvelope ??
                    ev.economicPropagationEnvelope;
                  return env ? (
                  <p className="font-mono text-[8px] text-violet-200/80">
                    {env.startsWith("live.") ? "LIVE" : "DEMO"} · {env}
                  </p>
                  ) : null;
                })()}
                <p className="text-[11px] font-medium text-slate-100">{ev.label}</p>
                {(() => {
                  const ec = classifyEconomicCommandStreamItem(ev);
                  return ec ? (
                    <p className="mt-0.5 text-[9px] text-cyan-100/85">
                      <span className="font-mono">{ec}</span> — {ECONOMIC_COMMAND_REALTIME_CLASS_LABELS[ec]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const isr = classifyIndustrialSituationRoomStreamItem(ev);
                  return isr ? (
                    <p className="mt-0.5 text-[9px] text-emerald-100/85">
                      <span className="font-mono">{isr}</span> — {INDUSTRIAL_SITUATION_ROOM_REALTIME_CLASS_LABELS[isr]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const ioc = classifyIndustrialOperationalContinuityStreamItem(ev);
                  return ioc ? (
                    <p className="mt-0.5 text-[9px] text-teal-100/85">
                      <span className="font-mono">{ioc}</span> — {INDUSTRIAL_OPERATIONAL_CONTINUITY_REALTIME_CLASS_LABELS[ioc]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const iev = classifyIndustrialEvidenceStreamItem(ev);
                  return iev ? (
                    <p className="mt-0.5 text-[9px] text-slate-200/85">
                      <span className="font-mono">{iev}</span> — {INDUSTRIAL_EVIDENCE_REALTIME_CLASS_LABELS[iev]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const crg = classifyCommercialRelationshipGraphStreamItem(ev);
                  return crg ? (
                    <p className="mt-0.5 text-[9px] text-cyan-100/80">
                      <span className="font-mono">{crg}</span> — {COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS[crg]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const rcat = classifyRelationalCatalogStreamItem(ev);
                  return rcat ? (
                    <p className="mt-0.5 text-[9px] text-emerald-100/80">
                      <span className="font-mono">{rcat}</span> — {RELATIONAL_CATALOG_REALTIME_CLASS_LABELS[rcat]}
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const rord = classifyRelationalOrdersStreamItem(ev);
                  return rord ? (
                    <p className="mt-0.5 text-[9px] text-sky-100/85">
                      <span className="font-mono">{rord}</span> — {RELATIONAL_ORDERS_REALTIME_CLASS_LABELS[rord]}
                    </p>
                  ) : null;
                })()}
                <p className="text-[10px] leading-snug text-slate-400">{ev.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
