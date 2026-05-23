"use client";

import { vx } from "./vx-styles";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", onConfirm, onCancel, loading }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/15 p-4 shadow-xl" style={{ backgroundColor: vx.graphite }}>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-white/75">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-white/15 px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/5"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: vx.teal }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Applying…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
