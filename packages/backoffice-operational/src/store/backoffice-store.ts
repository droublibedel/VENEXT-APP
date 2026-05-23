import type { BackofficeSession, BackofficeOtpChallenge } from "../types/auth.types.js";
import type { BackofficeInternalAuditEntry } from "../types/audit.types.js";
import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance, JourneyEvent } from "../types/journey.types.js";
import type { BackofficeSupportTicket } from "../types/support.types.js";
import type {
  BackofficeDocumentRef,
  BackofficeEnterpriseProfile,
  BackofficeFeatureFlagState,
  BackofficeUserProfile,
  PlatformHealthSnapshot,
} from "../types/platform.types.js";

function id(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export class BackofficeStore {
  sessions = new Map<string, BackofficeSession>();
  otpChallenges = new Map<string, BackofficeOtpChallenge>();
  errors: BackofficeErrorEvent[] = [];
  journeys: BackofficeJourneyInstance[] = [];
  journeyEvents: JourneyEvent[] = [];
  support: BackofficeSupportTicket[] = [];
  audit: BackofficeInternalAuditEntry[] = [];
  users: BackofficeUserProfile[] = [];
  enterprises: BackofficeEnterpriseProfile[] = [];
  documents: BackofficeDocumentRef[] = [];
  flags: BackofficeFeatureFlagState[] = [];
  health: PlatformHealthSnapshot | null = null;
  notifications: { id: string; at: string; priority: string; title: string; read: boolean }[] = [];

  reset(): void {
    this.sessions.clear();
    this.otpChallenges.clear();
    this.errors = [];
    this.journeys = [];
    this.journeyEvents = [];
    this.support = [];
    this.audit = [];
    this.users = [];
    this.enterprises = [];
    this.documents = [];
    this.flags = [];
    this.health = null;
    this.notifications = [];
  }

  appendAudit(input: Omit<BackofficeInternalAuditEntry, "id" | "at">): BackofficeInternalAuditEntry {
    const entry: BackofficeInternalAuditEntry = { id: id(), at: now(), ...input };
    this.audit.unshift(entry);
    if (this.audit.length > 5000) this.audit.length = 5000;
    return entry;
  }

  addError(event: Omit<BackofficeErrorEvent, "id" | "occurredAt" | "treatmentStatus"> & {
    id?: string;
    occurredAt?: string;
    treatmentStatus?: BackofficeErrorEvent["treatmentStatus"];
  }): BackofficeErrorEvent {
    const row: BackofficeErrorEvent = {
      id: event.id ?? id(),
      occurredAt: event.occurredAt ?? now(),
      treatmentStatus: event.treatmentStatus ?? "NEW",
      ...event,
    };
    this.errors.unshift(row);
    if (this.errors.length > 10000) this.errors.length = 10000;
    return row;
  }

  addJourney(row: BackofficeJourneyInstance): void {
    this.journeys.unshift(row);
    if (this.journeys.length > 5000) this.journeys.length = 5000;
  }

  updateJourney(journeyId: string, patch: Partial<BackofficeJourneyInstance>): BackofficeJourneyInstance | undefined {
    const idx = this.journeys.findIndex((j) => j.journeyId === journeyId);
    if (idx < 0) return undefined;
    this.journeys[idx] = { ...this.journeys[idx]!, ...patch };
    return this.journeys[idx];
  }

  findJourney(journeyId: string): BackofficeJourneyInstance | undefined {
    return this.journeys.find((j) => j.journeyId === journeyId);
  }

  addJourneyEvent(event: Omit<JourneyEvent, "id" | "at"> & { id?: string; at?: string }): JourneyEvent {
    const row: JourneyEvent = { id: event.id ?? id(), at: event.at ?? now(), ...event };
    this.journeyEvents.unshift(row);
    return row;
  }

  addSupport(ticket: Omit<BackofficeSupportTicket, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }): BackofficeSupportTicket {
    const ts = now();
    const row: BackofficeSupportTicket = {
      id: ticket.id ?? id(),
      createdAt: ticket.createdAt ?? ts,
      updatedAt: ticket.updatedAt ?? ts,
      ...ticket,
    };
    this.support.unshift(row);
    return row;
  }

  pushNotification(priority: string, title: string): void {
    this.notifications.unshift({ id: id(), at: now(), priority, title, read: false });
    if (this.notifications.length > 200) this.notifications.length = 200;
  }
}

let singleton: BackofficeStore | null = null;

export function getBackofficeStore(): BackofficeStore {
  if (!singleton) singleton = new BackofficeStore();
  return singleton;
}

export function resetBackofficeStore(): void {
  if (singleton) singleton.reset();
  else singleton = new BackofficeStore();
}
