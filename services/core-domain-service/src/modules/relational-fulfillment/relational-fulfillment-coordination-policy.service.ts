import { BadRequestException, Injectable } from "@nestjs/common";
import type { RelationalFulfillmentTaskStatus } from "@prisma/client";

const TERMINAL_TASK_STATUSES: RelationalFulfillmentTaskStatus[] = ["COMPLETED", "CANCELLED"];

const ALLOWED: Array<[RelationalFulfillmentTaskStatus, RelationalFulfillmentTaskStatus]> = [
  ["OPEN", "IN_PROGRESS"],
  ["OPEN", "BLOCKED"],
  ["OPEN", "CANCELLED"],
  ["OPEN", "WAITING_EXTERNAL_CONFIRMATION"],
  ["OPEN", "WAITING_CORRIDOR_VALIDATION"],
  ["IN_PROGRESS", "BLOCKED"],
  ["IN_PROGRESS", "CANCELLED"],
  ["IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION"],
  ["IN_PROGRESS", "WAITING_CORRIDOR_VALIDATION"],
  ["IN_PROGRESS", "COMPLETED"],
  ["WAITING_EXTERNAL_CONFIRMATION", "IN_PROGRESS"],
  ["WAITING_EXTERNAL_CONFIRMATION", "BLOCKED"],
  ["WAITING_EXTERNAL_CONFIRMATION", "CANCELLED"],
  ["WAITING_EXTERNAL_CONFIRMATION", "COMPLETED"],
  ["WAITING_CORRIDOR_VALIDATION", "IN_PROGRESS"],
  ["WAITING_CORRIDOR_VALIDATION", "BLOCKED"],
  ["WAITING_CORRIDOR_VALIDATION", "CANCELLED"],
  ["WAITING_CORRIDOR_VALIDATION", "COMPLETED"],
  ["BLOCKED", "OPEN"],
  ["COMPLETED", "OPEN"],
  ["CANCELLED", "OPEN"],
];

@Injectable()
export class RelationalFulfillmentCoordinationPolicyService {
  isTerminal(status: RelationalFulfillmentTaskStatus): boolean {
    return TERMINAL_TASK_STATUSES.includes(status);
  }

  assertTaskStatusTransitionAllowed(
    from: RelationalFulfillmentTaskStatus,
    to: RelationalFulfillmentTaskStatus,
    opts?: { reopen?: boolean },
  ): void {
    if (from === to) return;
    if (opts?.reopen) {
      if ((from === "BLOCKED" || from === "COMPLETED" || from === "CANCELLED") && to === "OPEN") return;
      throw new BadRequestException({
        code: "fulfillment_task_reopen_forbidden",
        detail: `${from}->${to}`,
      });
    }
    if (TERMINAL_TASK_STATUSES.includes(from)) {
      throw new BadRequestException({
        code: "fulfillment_task_terminal_no_transition",
        detail: from,
      });
    }
    const key = `${from}->${to}` as `${RelationalFulfillmentTaskStatus}->${RelationalFulfillmentTaskStatus}`;
    const ok = ALLOWED.some(([a, b]) => `${a}->${b}` === key);
    if (!ok) {
      throw new BadRequestException({ code: "fulfillment_task_transition_forbidden", detail: key });
    }
  }

  assertConfirmationsSatisfied(input: {
    requiresBuyerConfirmation: boolean;
    requiresSellerConfirmation: boolean;
    buyerConfirmedAt: Date | null;
    sellerConfirmedAt: Date | null;
  }): void {
    if (input.requiresBuyerConfirmation && !input.buyerConfirmedAt) {
      throw new BadRequestException({
        code: "fulfillment_task_buyer_confirmation_required",
        buyerConfirmationSatisfied: false,
      });
    }
    if (input.requiresSellerConfirmation && !input.sellerConfirmedAt) {
      throw new BadRequestException({
        code: "fulfillment_task_seller_confirmation_required",
        sellerConfirmationSatisfied: false,
      });
    }
  }
}
