import { Injectable } from "@nestjs/common";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

const MAX_CONTEXT_HISTORY = 5;

export type CommercialContextPatch = {
  activeContext?: Record<string, unknown>;
  lastWorkspace?: string;
  lastSubTab?: string;
  navigationEntry?: Record<string, unknown>;
};

@Injectable()
export class CommercialContextPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  contextKey(actorId: string) {
    return `ctx-${actorId}`;
  }

  trimHistory(history: unknown[]): Record<string, unknown>[] {
    const rows = (Array.isArray(history) ? history : []).filter(
      (h): h is Record<string, unknown> => typeof h === "object" && h !== null,
    );
    return rows.slice(-MAX_CONTEXT_HISTORY);
  }

  async getContext(actorId: string) {
    const key = this.contextKey(actorId);
    return this.getByKey<Record<string, unknown>>("CommercialContextState", key);
  }

  async saveContext(actorId: string, patch: CommercialContextPatch) {
    const key = this.contextKey(actorId);
    const existing = (await this.getContext(actorId)) ?? {
      id: key,
      actorId,
      activeContext: {},
      history: [],
    };
    const history = this.trimHistory([
      ...(Array.isArray(existing.history) ? existing.history : []),
      ...(patch.navigationEntry ? [patch.navigationEntry] : []),
    ]);
    const activeContext = {
      ...(typeof existing.activeContext === "object" && existing.activeContext !== null
        ? existing.activeContext
        : {}),
      ...(patch.activeContext ?? {}),
      ...(patch.lastSubTab ? { lastSubTab: patch.lastSubTab } : {}),
    };
    return this.upsert(
      "CommercialContextState",
      key,
      {
        ...existing,
        actorId,
        activeContext,
        history,
        lastWorkspace: patch.lastWorkspace ?? existing.lastWorkspace,
        updatedAt: new Date().toISOString(),
      },
      { organizationId: actorId },
    );
  }
}
