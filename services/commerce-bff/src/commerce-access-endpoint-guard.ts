import type { Request, Response, NextFunction } from "express";

import { createCommerceAccessMiddleware } from "./commerce-access-middleware.js";

type AccessResource =
  | "relational_catalog"
  | "order"
  | "settlement"
  | "wallet"
  | "messaging"
  | "mail";

const ENDPOINT_RESOURCE: Record<string, AccessResource> = {
  catalog: "relational_catalog",
  orders: "order",
  wallet: "wallet",
  messaging: "messaging",
  settlements: "settlement",
  mail: "mail",
  products: "relational_catalog",
  home: "relational_catalog",
};

/** Garde dynamique par segment `:endpoint` — évite bypass URL (20.83-A). */
export function createEndpointAccessGuard() {
  return (req: Request, res: Response, next: NextFunction) => {
    const endpoint = String(req.params.endpoint ?? "");
    const resource = ENDPOINT_RESOURCE[endpoint];
    if (!resource) {
      next();
      return;
    }
    createCommerceAccessMiddleware(resource)(req, res, next);
  };
}
