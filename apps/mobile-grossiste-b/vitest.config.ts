import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}", "src/tests/**/*.spec.{ts,tsx}"],
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 30_000,
    teardownTimeout: 5_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
