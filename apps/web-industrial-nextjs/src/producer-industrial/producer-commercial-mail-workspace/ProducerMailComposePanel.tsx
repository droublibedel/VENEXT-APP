"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import type { ProducerCommercialMailView, ProducerMailPriority, ProducerMailThread } from "./producer-commercial-mail.types";
import type { ProducerMailGovernance } from "./producer-commercial-mail-governance";

const MOCK_ATTACHMENTS = [
  { id: "mock-pdf", label: "Bon de commande.pdf", kind: "pdf" },
  { id: "mock-xlsx", label: "Quantités.xlsx", kind: "xlsx" },
  { id: "mock-docx", label: "Conditions.docx", kind: "docx" },
  { id: "mock-csv", label: "Export.csv", kind: "csv" },
  { id: "mock-png", label: "Fiche.png", kind: "png" },
  { id: "mock-jpg", label: "Photo.jpg", kind: "jpg" },
] as const;

const DRAFT_KEY = "producer-commercial-mail-draft";

type DraftState = {
  subject: string;
  body: string;
  to: string;
  cc: string;
  priority: ProducerMailPriority;
  orderId: string;
  productIds: string[];
};

function loadDraft(): DraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: DraftState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export const ProducerMailComposePanel = memo(function ProducerMailComposePanel({
  open,
  onClose,
  view,
  governance,
  replyThread,
}: {
  open: boolean;
  onClose: () => void;
  view: ProducerCommercialMailView | null;
  governance: ProducerMailGovernance;
  replyThread: ProducerMailThread | null;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [priority, setPriority] = useState<ProducerMailPriority>("normal");
  const [orderId, setOrderId] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const draft = loadDraft();
    if (replyThread) {
      setSubject(replyThread.subject.startsWith("RE:") ? replyThread.subject : `RE: ${replyThread.subject}`);
      setTo(replyThread.from.email);
      setBody(`\n\n---\n${replyThread.messages[0]?.body ?? ""}`);
    } else if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
      setTo(draft.to);
      setCc(draft.cc);
      setPriority(draft.priority);
      setOrderId(draft.orderId);
      setProductIds(draft.productIds);
    } else {
      setSubject("");
      setBody("");
      setTo("");
      setCc("");
      setPriority("normal");
      setOrderId("");
      setProductIds([]);
    }
    setSelectedAttachments([]);
    setDraftSaved(false);
  }, [open, replyThread]);

  const orderRequired = governance.orderContextRequired;
  const directAllowed = governance.directMailAllowed;
  const productAllowed = governance.productContextAllowed;

  const canSend = useMemo(() => {
    if (!governance.composeVisible) return false;
    if (!subject.trim() || !body.trim() || !to.trim()) return false;
    if (orderRequired && !orderId) return false;
    if (!directAllowed && !orderId && productIds.length === 0) return false;
    return true;
  }, [governance.composeVisible, subject, body, to, orderId, orderRequired, directAllowed, productIds]);

  const handleSaveDraft = useCallback(() => {
    saveDraft({ subject, body, to, cc, priority, orderId, productIds });
    setDraftSaved(true);
  }, [subject, body, to, cc, priority, orderId, productIds]);

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!open) return null;

  return (
    <section
      className="absolute inset-0 z-20 flex flex-col bg-slate-950/98 backdrop-blur-sm"
      data-testid="producer-mail-compose-panel"
    >
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <h3 className="text-xs font-semibold text-slate-100">
          {replyThread ? "Réponse professionnelle" : "Nouveau mail commercial"}
        </h3>
        <button
          type="button"
          className="text-[10px] text-slate-500 hover:text-slate-300"
          onClick={onClose}
          data-testid="producer-mail-compose-close"
        >
          Fermer
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-[11px]">
        <label className="block">
          <span className="text-slate-500">Destinataires</span>
          <input
            className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="partenaire@reseau.ci"
            data-testid="mail-compose-to"
            list="mail-partners"
          />
          <datalist id="mail-partners">
            {view?.partners.map((p) => (
              <option key={p.id} value={p.email}>
                {p.name}
              </option>
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="text-slate-500">CC</span>
          <input
            className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            data-testid="mail-compose-cc"
          />
        </label>

        <label className="block">
          <span className="text-slate-500">Objet</span>
          <input
            className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            data-testid="mail-compose-subject"
          />
        </label>

        <label className="block">
          <span className="text-slate-500">Message</span>
          <textarea
            className="mt-1 min-h-[140px] w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-2 text-slate-200"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            data-testid="mail-compose-body"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-slate-500">Priorité</span>
            <select
              className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProducerMailPriority)}
              data-testid="mail-compose-priority"
            >
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
          </label>

          <label className="block">
            <span className="text-slate-500">Commande liée {orderRequired ? "(requis)" : "(optionnel)"}</span>
            <select
              className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              data-testid="mail-compose-order"
            >
              <option value="">— Aucune —</option>
              {view?.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.reference} — {o.partner}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-slate-500">Règlement lié (optionnel)</span>
            <select className="mt-1 w-full rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-200" data-testid="mail-compose-settlement">
              <option value="">— Aucun —</option>
              {view?.settlements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.reference} — {s.partner}
                </option>
              ))}
            </select>
          </label>
        </div>

        {productAllowed ? (
          <fieldset className="rounded border border-slate-800/70 p-3" data-testid="mail-compose-products">
            <legend className="px-1 text-[10px] text-slate-500">Produits liés (optionnel)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {view?.products.map((p) => (
                <label key={p.id} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className="rounded border border-slate-800/70 p-3" data-testid="mail-compose-attachments-mock">
          <legend className="px-1 text-[10px] text-slate-500">Pièces jointes (fondation UI)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOCK_ATTACHMENTS.map((m) => (
              <label key={m.id} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <input
                  type="checkbox"
                  checked={selectedAttachments.includes(m.id)}
                  onChange={() =>
                    setSelectedAttachments((prev) =>
                      prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                    )
                  }
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        {draftSaved ? (
          <p className="text-[10px] text-emerald-400/90" data-testid="mail-compose-draft-saved">
            Brouillon enregistré localement.
          </p>
        ) : null}
      </div>

      <footer className="flex gap-2 border-t border-slate-800 px-4 py-3">
        <button
          type="button"
          className="rounded border border-slate-700 px-3 py-1.5 text-[10px] text-slate-400"
          onClick={handleSaveDraft}
          data-testid="mail-compose-save-draft"
        >
          Enregistrer brouillon
        </button>
        <button
          type="button"
          className="rounded bg-emerald-600/80 px-3 py-1.5 text-[10px] text-white disabled:opacity-40"
          disabled={!canSend}
          data-testid="mail-compose-send"
        >
          Envoyer le mail
        </button>
      </footer>
    </section>
  );
});
