"use client";

import { memo } from "react";

import type { ProducerMailAttachment, ProducerMailAttachmentKind } from "./producer-commercial-mail.types";

const KIND_LABEL: Record<ProducerMailAttachmentKind, string> = {
  pdf: "PDF",
  xlsx: "Excel",
  docx: "Word",
  csv: "CSV",
  png: "Image PNG",
  jpg: "Image JPG",
};

export const ProducerMailAttachmentsPanel = memo(function ProducerMailAttachmentsPanel({
  attachments,
  compact = false,
}: {
  attachments: ProducerMailAttachment[];
  compact?: boolean;
}) {
  if (!attachments.length) {
    return (
      <p className="text-[10px] text-slate-500" data-testid="producer-mail-attachments-empty">
        Aucune pièce jointe.
      </p>
    );
  }

  return (
    <section data-testid="producer-mail-attachments-panel" className={compact ? "" : "producer-industrial-card p-4"}>
      {!compact ? (
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Pièces jointes</h3>
      ) : (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">Pièces jointes</p>
      )}
      <ul className="space-y-2">
        {attachments.map((att) => (
          <li
            key={att.id}
            className="flex items-center justify-between rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2"
            data-testid={`mail-attachment-${att.id}`}
          >
            <div>
              <p className="text-[11px] font-medium text-slate-200">{att.name}</p>
              <p className="text-[9px] text-slate-500">
                {KIND_LABEL[att.kind]} · {att.sizeLabel} · {att.at}
              </p>
              {att.activityLabel ? (
                <p className="text-[9px] text-emerald-400/80">{att.activityLabel}</p>
              ) : null}
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] uppercase text-slate-400">
              {att.kind}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
