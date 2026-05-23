import type { OperationalSignalItem } from "../types";

/** Coalesces burst WS traffic for incremental render (Instruction 5 §9). */
export class SignalBatcher {
  private buf: OperationalSignalItem[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly flush: (items: OperationalSignalItem[]) => void,
    private readonly maxBatch = 20,
    private readonly delayMs = 320,
  ) {}

  push(item: OperationalSignalItem) {
    this.buf.push(item);
    if (this.buf.length >= this.maxBatch) {
      this.flushNow();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => this.flushNow(), this.delayMs);
    }
  }

  private flushNow() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buf.length === 0) return;
    const chunk = this.buf.splice(0, this.maxBatch);
    this.flush(chunk);
  }
}
