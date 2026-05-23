import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "relational-order-orchestration": path.resolve(__dirname, "./src"),
    },
  },
});
