"use client";

import { memo } from "react";

import type { ProducerMailFolderId } from "./producer-commercial-mail.types";

const FOLDERS: { id: ProducerMailFolderId; label: string; icon?: string }[] = [
  { id: "inbox", label: "Boîte de réception" },
  { id: "sent", label: "Envoyés" },
  { id: "drafts", label: "Brouillons" },
  { id: "archived", label: "Archivés" },
  { id: "priority", label: "Prioritaires" },
  { id: "network", label: "Réseau commercial" },
  { id: "orders", label: "Commandes" },
  { id: "settlements", label: "Règlements" },
  { id: "documents", label: "Documents" },
];

export const ProducerCommercialMailSidebar = memo(function ProducerCommercialMailSidebar({
  activeFolder,
  onFolderChange,
  counts,
}: {
  activeFolder: ProducerMailFolderId;
  onFolderChange: (folder: ProducerMailFolderId) => void;
  counts: Partial<Record<ProducerMailFolderId, number>>;
}) {
  return (
    <nav
      className="flex h-full flex-col border-r border-slate-800/80 bg-slate-950/40 py-3"
      aria-label="Dossiers boîte mail"
      data-testid="producer-mail-sidebar"
    >
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Boîte mail réseau
      </p>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-1">
        {FOLDERS.map((folder) => {
          const active = activeFolder === folder.id;
          const count = counts[folder.id];
          return (
            <li key={folder.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] transition-colors ${
                  active
                    ? "bg-emerald-500/12 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                }`}
                onClick={() => onFolderChange(folder.id)}
                data-testid={`mail-folder-${folder.id}`}
              >
                <span>{folder.label}</span>
                {count != null && count > 0 ? (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                    {count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
