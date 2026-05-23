import type { Request, Response, NextFunction } from "express";
import {
  compareActorPoleAccess,
  grossisteASeparationUserMessage,
  rejectGrossisteAOnProducerApiRoute,
} from "enterprise-commercial-governance/separation";
import { toHumanizedBffUserMessage } from "./commerce-humanized-response.js";

function actorRoleFromRequest(req: Request): string {
  return String(req.query.actorRole ?? req.headers["x-actor-role"] ?? "");
}

/** Bloque Grossiste A sur routes / producer et pôles industriels (Instruction 20.86-C). */
export function createGrossisteASeparationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = actorRoleFromRequest(req);
    if (!role.toUpperCase().includes("GROSSISTE_A")) {
      next();
      return;
    }

    try {
      rejectGrossisteAOnProducerApiRoute(role, req.path);
    } catch {
      res.status(403).json({
        dataSource: "live",
        fallbackUsed: false,
        payload: null,
        userMessage: toHumanizedBffUserMessage(
          grossisteASeparationUserMessage("WRONG_ACTOR_ROUTE"),
        ),
      });
      return;
    }

    const pole = String(req.query.pole ?? req.query.poleId ?? "");
    if (pole) {
      const cmp = compareActorPoleAccess(role, pole);
      if (!cmp.allowed) {
        res.status(403).json({
          dataSource: "live",
          fallbackUsed: false,
          payload: null,
          userMessage: toHumanizedBffUserMessage(cmp.userMessage),
        });
        return;
      }
    }

    next();
  };
}
