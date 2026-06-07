/**
 * VENEXT-WALLET-SECURITY-01 — détection d'inactivité utilisateur (touch, scroll, navigation, saisie).
 */
export type UserActivityListener = () => void;

export type UserActivityTrackerOptions = {
  onActivity: UserActivityListener;
  enabled?: boolean;
};

export class UserActivityTrackerRuntime {
  private readonly onActivity: UserActivityListener;
  private enabled: boolean;
  private attached = false;
  private readonly handler: () => void;

  constructor(options: UserActivityTrackerOptions) {
    this.onActivity = options.onActivity;
    this.enabled = options.enabled !== false;
    this.handler = () => {
      if (!this.enabled) return;
      this.onActivity();
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  attach(): void {
    if (this.attached || typeof document === "undefined") return;
    this.attached = true;
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener("pointerdown", this.handler, opts);
    document.addEventListener("pointerup", this.handler, opts);
    document.addEventListener("touchstart", this.handler, opts);
    document.addEventListener("keydown", this.handler, opts);
    document.addEventListener("wheel", this.handler, opts);
    document.addEventListener("scroll", this.handler, opts);
    window.addEventListener("focus", this.handler);
    window.addEventListener("popstate", this.handler);
    document.addEventListener("input", this.handler, opts);
    document.addEventListener("change", this.handler, opts);
  }

  detach(): void {
    if (!this.attached || typeof document === "undefined") return;
    this.attached = false;
    document.removeEventListener("pointerdown", this.handler, true);
    document.removeEventListener("pointerup", this.handler, true);
    document.removeEventListener("touchstart", this.handler, true);
    document.removeEventListener("keydown", this.handler, true);
    document.removeEventListener("wheel", this.handler, true);
    document.removeEventListener("scroll", this.handler, true);
    window.removeEventListener("focus", this.handler);
    window.removeEventListener("popstate", this.handler);
    document.removeEventListener("input", this.handler, true);
    document.removeEventListener("change", this.handler, true);
  }

  /** Signal explicite (navigation programmatique, etc.). */
  signalActivity(): void {
    this.handler();
  }
}
