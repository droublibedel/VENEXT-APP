import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/backoffice-operational/vitest.config.ts",
  "packages/commerce-humanized-errors/vitest.config.ts",
  "packages/commerce-ux-harmony/vitest.config.ts",
  "packages/commerce-access-control/vitest.config.ts",
  "packages/enterprise-commercial-governance/vitest.config.ts",
  "services/commerce-bff/vitest.config.ts",
]);
