import type { NextRequest } from "next/server";

import { dispatchProducerIndustrialBff } from "../../_lib/producer-industrial-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segment = path?.[0];
  if (!segment) {
    return Response.json(
      {
        error: "missing_endpoint",
        available: [
          "overview",
          "executive",
          "commercial-network",
          "marketing-activation",
          "supply-logistics",
          "finance-collections",
          "data-intelligence",
          "map-control",
          "alerts",
          "partners",
          "products",
          "orders-summary",
          "network-activity",
        ],
      },
      { status: 400 },
    );
  }
  return dispatchProducerIndustrialBff(req, segment);
}

export const GET = handle;
