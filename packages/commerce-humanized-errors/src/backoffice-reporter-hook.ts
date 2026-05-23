import type { CommerceErrorKey } from "./commerce-humanized-errors.types";

export type BackofficeReporterPayload = {
  commerceErrorKey: CommerceErrorKey;
  technicalMessage: string;
  internalStack?: string;
  application: string;
  screen?: string;
  action?: string;
  routeOrApi?: string;
  module?: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  actorId?: string;
  actorRole?: string;
};

type ReporterFn = (payload: BackofficeReporterPayload) => void;

let reporter: ReporterFn | null = null;

export function registerBackofficeHumanizedErrorReporter(fn: ReporterFn | null): void {
  reporter = fn;
}

/** Déclenche le pipeline back-office si un reporter est enregistré (Instruction BACKOFFICE-01). */
export function notifyBackofficeFromHumanizedError(payload: BackofficeReporterPayload): void {
  reporter?.(payload);
}
