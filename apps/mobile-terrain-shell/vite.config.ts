import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: process.env.COMMERCE_BFF_URL ?? "http://127.0.0.1:3210",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@venext/mobile-detaillant": path.resolve(__dirname, "../mobile-detaillant/src"),
      "@venext/mobile-grossiste-b": path.resolve(__dirname, "../mobile-grossiste-b/src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
