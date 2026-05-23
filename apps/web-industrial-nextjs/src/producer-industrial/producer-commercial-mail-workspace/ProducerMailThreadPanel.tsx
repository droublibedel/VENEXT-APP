"use client";

import { memo } from "react";

import type { ProducerMailThread } from "./producer-commercial-mail.types";
import { ProducerMailAttachmentsPanel } from "./ProducerMailAttachmentsPanel";

export const ProducerMailThreadPanel = memo(function ProducerMailThreadPanel({
  thread,
  onReply,
}: {
  thread: ProducerMailThread | null;
  onReply: () => void;
}) {
  if (!thread) {
    return (
      <section
        className="flex flex-1 items-center justify-center p-8 text-[11px] text-slate-500"
        data-testid="producer-mail-thread-empty"
      >
        Sélectionnez un message pour afficher le fil professionnel.
      </section>
    );
  }

  const message = thread.messages[0];
  if (!message) {
    return (
      <section className="p-4 text-[11px] text-slate-500" data-testid="producer-mail-thread-panel">
        Message indisponible.
      </section>
    );
  }

  return (
    <article className="flex flex-1 flex-col overflow-hidden" data-testid="producer-mail-thread-panel">
      <header className="border-b border-slate-800/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-50" data-testid="mail-thread-subject">
          {thread.subject}
        </h2>
        <div className="mt-2 space-y-1 text-[10px] text-slate-500">
          <p>
            <span className="text-slate-600">De :</span>{" "}
            <span className="text-slate-300">
              {message.from.name} &lt;{message.from.email}&gt;
            </span>
            {message.from.role ? <span className="text-slate-600"> — {message.from.role}</span> : null}
          </p>
          <p>
            <span className="text-slate-600">À :</span>{" "}
            {message.to.map((a) => `${a.name} <${a.email}>`).join(", ")}
          </p>
          <p>
            <span className="text-slate-600">Date :</span> {message.at}
          </p>
          {thread.orderReference ? (
            <p data-testid="mail-thread-order-ref">
              <span className="text-slate-600">Commande :</span>{" "}
              <span className="text-emerald-400/90">{thread.orderReference}</span>
            </p>
          ) : null}
          {thread.settlementReference ? (
            <p data-testid="mail-thread-settlement-ref">
              <span className="text-slate-600">Règlement :</span>{" "}
              <span className="text-emerald-400/90">{thread.settlementReference}</span>
            </p>
          ) : null}
          {thread.productNames?.length ? (
            <p data-testid="mail-thread-products">
              <span className="text-slate-600">Produits :</span> {thread.productNames.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-700 px-2.5 py-1 text-[10px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
            onClick={onReply}
            data-testid="mail-thread-reply"
          >
            Répondre
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-300"
          data-testid="mail-thread-body"
        >
          {message.body}
        </div>
      </div>

      {message.attachments.length > 0 ? (
        <div className="border-t border-slate-800/80 px-4 py-3">
          <ProducerMailAttachmentsPanel attachments={message.attachments} compact />
        </div>
      ) : null}
    </article>
  );
});
