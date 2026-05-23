const KEY = "venext_financial_tx_queue_v1";

export type QueuedFinancialTx = {
  id: string;
  body: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

function read(): QueuedFinancialTx[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as QueuedFinancialTx[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function write(items: QueuedFinancialTx[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueFinancialTxDraft(body: Record<string, unknown>): QueuedFinancialTx {
  const item: QueuedFinancialTx = {
    id: crypto.randomUUID(),
    body,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  write([...read(), item]);
  return item;
}

export function listFinancialTxQueue(): QueuedFinancialTx[] {
  return read();
}
