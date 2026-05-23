import { Controller, Get, Query } from "@nestjs/common";
import {
  evaluateFeatureFlag,
  type FlagRule,
} from "@venext/shared-business-rules";

@Controller("v1/wallet")
export class WalletFoundationController {
  @Get("feature-flags/sample")
  sample(@Query("userId") userId = "demo-user") {
    const rules: FlagRule[] = [
      {
        featureKey: "wallet",
        enabled: true,
        scope: { type: "global" },
        priority: 1,
      },
      {
        featureKey: "wallet",
        enabled: false,
        scope: { type: "user", userId: "blocked-user" },
        priority: 50,
      },
    ];
    const enabled = evaluateFeatureFlag(rules, "wallet", {
      dimensions: [
        { type: "global" },
        { type: "user", userId },
        { type: "country", iso3166: "SN" },
      ],
    });
    return { feature: "wallet", enabled };
  }
}
