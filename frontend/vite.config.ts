import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    // Em desenvolvimento, /api é encaminhado para o backend local.
    proxy: { "/api": "http://localhost:3000" },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
