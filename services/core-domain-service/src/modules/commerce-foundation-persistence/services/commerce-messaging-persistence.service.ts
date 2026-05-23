import { Injectable } from "@nestjs/common";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class CommerceMessagingPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listThreads(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("CommerceMessageThread", filter);
  }

  getThread(id: string) {
    return this.getByKey<Record<string, unknown>>("CommerceMessageThread", id);
  }

  appendMessage(threadId: string, message: Record<string, unknown>) {
    return this.getThread(threadId).then(async (thread) => {
      if (!thread) return null;
      const messages = Array.isArray(thread.messages) ? [...thread.messages] : [];
      messages.push(message);
      return this.upsert(
        "CommerceMessageThread",
        threadId,
        { ...thread, messages, updatedAt: new Date().toISOString() },
        { relationshipId: thread.relationshipId as string },
      );
    });
  }
}
