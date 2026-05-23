import type { Request, Response, NextFunction } from "express";

import { evaluateBffAccess } from "./commerce-access-request.js";
import { toHumanizedBffUserMessage } from "./commerce-humanized-response.js";

type AccessResource =
  | "relational_catalog"
  | "order"
  | "delivery"
  | "settlement"
  | "wallet"
  | "messaging"
  | "mail"
  | "notifications"
  | "activity_feed"
  | "offline_cache";

/** Garde BFF — commerce-access-control centralisé (Instructions 20.83 / 20.83-A). */
export function createCommerceAccessMiddleware(resource: AccessResource) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { allowed, userMessage } = evaluateBffAccess(req, resource);
    if (!allowed) {
      res.status(403).json({
        dataSource: "live",
        fallbackUsed: false,
        payload: null,
        userMessage: toHumanizedBffUserMessage(
          userMessage,
          "Cette action n’est pas disponible pour le moment.",
        ),
      });
      return;
    }
    next();
  };
}
